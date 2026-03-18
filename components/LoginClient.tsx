"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";

export default function LoginClient({ nextHref = "/" }: { nextHref?: string }) {
  const router = useRouter();
  const { loginWithPassword, loginWithPairCode, isLoggedIn } = useAuthSession();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace(nextHref);
    }
  }, [isLoggedIn, router, nextHref]);

  const [inputType, setInputType] = useState<"password" | "paircode">("password");
  const [showSecret, setShowSecret] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!identifier || !secret) {
      setError("Harap isi semua field.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (inputType === "password") {
        await loginWithPassword(identifier, secret);
      } else {
        await loginWithPairCode(identifier, secret);
      }
      router.push(nextHref);
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
            <label className="mb-1 block text-xs font-black uppercase tracking-wider text-[#666]">
              {inputType === "password" ? "Email atau Username" : "Username"}
            </label>
            <input
              type={inputType === "password" ? "text" : "text"}
              className="w-full rounded-xl border border-primary/20 px-3 py-3 outline-none focus:border-primary"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value.toLowerCase().trim())}
              placeholder={inputType === "password" ? "you@email.com atau username" : "Username kamu"}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-black uppercase tracking-wider text-[#666]">
                {inputType === "password" ? "Password" : "Paircode"}
              </label>
              <button
                type="button"
                onClick={() => {
                  setInputType(inputType === "password" ? "paircode" : "password");
                  setSecret(""); // reset secret when switching modes
                }}
                className="text-xs font-bold text-primary hover:underline"
              >
                Gunakan {inputType === "password" ? "Paircode" : "Password"}
              </button>
            </div>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                className="w-full rounded-xl border border-primary/20 pl-3 pr-10 py-3 outline-none focus:border-primary font-medium tracking-wide"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                placeholder={inputType === "password" ? "Masukkan password" : "KODE-RAHASIA"}
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                tabIndex={-1}
              >
                {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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
