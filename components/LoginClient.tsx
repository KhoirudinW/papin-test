"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";

export default function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { loginWithPassword } = useAuthSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const next = params.get("next") || "/";

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithPassword(email, password);
      router.push(next);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login gagal.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-md px-4 md:px-0">
      <div className="card-primary p-6 md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Login PAPin</p>
        <h1 className="mt-1 text-3xl font-black text-[#454545]">Masuk untuk Unlock Test</h1>
        <p className="mt-2 text-sm text-[#666]">
          Gunakan akun existing dari PAPin Dashboard (Supabase project yang sama).
        </p>

        <div className="mt-6 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-black uppercase tracking-wider text-[#666]">Email</label>
            <input
              type="email"
              className="w-full rounded-xl border border-primary/20 px-3 py-3 outline-none focus:border-primary"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-black uppercase tracking-wider text-[#666]">Password</label>
            <input
              type="password"
              className="w-full rounded-xl border border-primary/20 px-3 py-3 outline-none focus:border-primary"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="btn btn-primary-solid mt-6 w-full"
        >
          {loading ? "Masuk..." : "Login"}
        </button>
      </div>
    </section>
  );
}
