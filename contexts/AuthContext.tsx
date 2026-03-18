"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export type SessionProfile = {
  id: string;
  pair_id: string | null;
  auth_user_id: string | null;
  email: string | null;
  full_name: string | null;
  name: string | null;
  role: string | null;
  is_admin: boolean;
};

type AuthContextValue = {
  user: User | null;
  profile: SessionProfile | null;
  loading: boolean;
  isLoggedIn: boolean;
  loginWithPassword: (identifier: string, password: string) => Promise<void>;
  loginWithPairCode: (identifier: string, pairCode: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string, name: string) => Promise<{ requiresEmailVerification: boolean }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrateProfile = useCallback(async (authUser: User | null) => {
    if (!authUser?.id) {
      setProfile(null);
      return;
    }

    const { data } = await supabase
      .from("user_profiles")
      .select("id, pair_id, auth_user_id, email, full_name, name, role")
      .eq("auth_user_id", authUser.id)
      .limit(1)
      .maybeSingle();

    if (!data) {
      setProfile(null);
      return;
    }

    // Cek is_admin dari tabel test_admins — 1 kali per sesi
    const { data: adminRow } = await supabase
      .from("test_admins")
      .select("id")
      .eq("profile_id", data.id)
      .limit(1)
      .maybeSingle();

    setProfile({ ...(data as Omit<SessionProfile, "is_admin">), is_admin: Boolean(adminRow?.id) });
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const authUser = data.session?.user || null;
        setUser(authUser);
        await hydrateProfile(authUser);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user || null;
      setUser(authUser);
      await hydrateProfile(authUser);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [hydrateProfile]);

  const resolveProfileByIdentifier = async (identifierInput: string): Promise<SessionProfile & { pair_code_plain?: string | null }> => {
    const identifier = identifierInput.trim();
    const normalizedIdentifier = identifier.toLowerCase();

    if (!identifier) {
      throw new Error("Email/Username wajib diisi.");
    }

    if (normalizedIdentifier.includes("@")) {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, pair_id, auth_user_id, email, full_name, name, role, pair_code_plain")
        .eq("email", normalizedIdentifier)
        .limit(10);

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Email tidak ditemukan.");
      if (data.length > 1) throw new Error("Email terhubung ke lebih dari satu profile. Gunakan username.");

      return data[0] as SessionProfile & { pair_code_plain?: string | null };
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, pair_id, auth_user_id, email, full_name, name, role, pair_code_plain")
      .ilike("name", normalizedIdentifier)
      .limit(10);

    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Username tidak ditemukan.");
    if (data.length > 1) throw new Error("Username tidak unik. Gunakan email.");

    return data[0] as SessionProfile & { pair_code_plain?: string | null };
  };

  const loginWithPassword = async (identifierInput: string, password: string) => {
    const identifier = identifierInput.trim();
    const normalizedIdentifier = identifier.toLowerCase();
    
    let email = "";
    if (normalizedIdentifier.includes("@")) {
      email = normalizedIdentifier;
    } else {
      const profile = await resolveProfileByIdentifier(identifier);
      if (!profile.email) {
        throw new Error("Username ditemukan tetapi tidak memiliki email terdaftar.");
      }
      email = profile.email;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password,
    });
    if (error) {
      throw error;
    }
  };

  const loginWithPairCode = async (identifierInput: string, pairCodeInput: string) => {
    const normalizedPairCode = pairCodeInput.trim().toUpperCase();
    if (!normalizedPairCode) {
      throw new Error("Pair code wajib diisi.");
    }

    const selectedProfile = await resolveProfileByIdentifier(identifierInput);
    if (!selectedProfile.pair_id) {
      throw new Error("Akun ini belum terhubung ke pasangan.");
    }

    let isPairCodeValid = false;
    if (selectedProfile.pair_code_plain) {
      isPairCodeValid = selectedProfile.pair_code_plain.trim().toUpperCase() === normalizedPairCode;
    }

    if (!isPairCodeValid) {
      const { data: pairRaw, error: pairError } = await supabase
        .from("pairs")
        .select("pair_code")
        .eq("id", selectedProfile.pair_id)
        .limit(1)
        .maybeSingle();

      if (pairError) throw pairError;

      const pairCodeHash = pairRaw?.pair_code ? String(pairRaw.pair_code) : "";
      isPairCodeValid = Boolean(pairCodeHash) && bcrypt.compareSync(normalizedPairCode, pairCodeHash);
    }

    if (!isPairCodeValid) {
      throw new Error("Pair code tidak valid.");
    }

    const virtualEmail = `${selectedProfile.name}@user.papin.local`;

    // Try normal signInWithPassword first using virtual email
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: virtualEmail,
      password: normalizedPairCode,
    });

    if (signInError) {
      // If user not found/invalid credentials, maybe the virtual user isn't created yet. Let's create it via our API route.
      const res = await fetch("/api/auth/register-paircode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: selectedProfile.name || "",
          secret: normalizedPairCode,
          name: selectedProfile.full_name || "",
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal membuat sesi pair code. Pastikan credentials benar.");
      }

      // Retry sign in after successful creation
      const { error: retryError } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password: normalizedPairCode,
      });

      if (retryError) {
        throw retryError;
      }
    }
  };

  const signUpWithPassword = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      throw error;
    }

    // Supabase returns a fake user object with empty identities if the email already exists
    // (Email Enumeration Protection feature)
    if (data.user?.identities?.length === 0) {
      throw new Error("Email sudah terdaftar. Silakan login menggunakan email ini.");
    }

    if (data.user) {
      // Trigger handle_new_user sudah buat row di user_profiles.
      // Jika karena suatu alasan trigger gagal/lambat, fallback ini akan berjalan.
      const { error: insertErr } = await supabase.from("user_profiles").upsert(
        {
          auth_user_id: data.user.id,
          email: data.user.email,
          full_name: name,
          name: name,
        },
        { onConflict: "auth_user_id", ignoreDuplicates: true }
      );
      if (insertErr) console.warn("Fallback insert:", insertErr);

      if (data.session) {
        await hydrateProfile(data.user);
      }
    }
    
    return { requiresEmailVerification: !data.session && !!data.user };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isLoggedIn: Boolean(user),
        loginWithPassword,
        loginWithPairCode,
        signUpWithPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used inside <AuthProvider>");
  }
  return ctx;
};
