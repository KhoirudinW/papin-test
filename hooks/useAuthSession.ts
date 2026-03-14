"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type SessionProfile = {
  id: string;
  pair_id: string | null;
  auth_user_id: string | null;
  email: string | null;
  full_name: string | null;
  name: string | null;
};

export const useAuthSession = () => {
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
      .select("id, pair_id, auth_user_id, email, full_name, name")
      .eq("auth_user_id", authUser.id)
      .limit(1)
      .maybeSingle();

    setProfile((data as SessionProfile | null) || null);
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

  const loginWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return {
    user,
    profile,
    loading,
    isLoggedIn: Boolean(user),
    loginWithPassword,
    logout,
  };
};
