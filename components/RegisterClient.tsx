"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";

export default function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextHref = searchParams.get("next") || "/";
  const { signUpWithPassword, loginWithPassword, isLoggedIn } = useAuthSession();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace(nextHref);
    }
  }, [isLoggedIn, router, nextHref]);

  const [inputType, setInputType] = useState<"password" | "paircode">("password");
  const [showSecret, setShowSecret] = useState(false);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [secret, setSecret] = useState("");
  const [confirmSecret, setConfirmSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRegister = async () => {
    if (!name || !identifier || !secret || !confirmSecret) {
      setError("Harap isi semua field.");
      return;
    }
    
    if (secret !== confirmSecret) {
      setError("Kombinasi keamanan (Password/Paircode) tidak cocok.");
      return;
    }
    
    setError("");
    setSuccessMsg("");
    setLoading(true);
    
    // Virtual Email Logic
    const isEmail = identifier.includes("@");
    let finalEmail = identifier;
    
    if (inputType === "paircode") {
      if (isEmail) {
        setError("Username tidak boleh berupa email saat menggunakan metode Paircode.");
        setLoading(false);
        return;
      }
      finalEmail = `${identifier}@user.papin.local`;
      
      try {
        const res = await fetch("/api/auth/register-paircode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, secret, name })
        });
        
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Gagal mendaftar Paircode");
        }
        
        // Seusai berhasil, pengguna bisa langsung login secara otomatis
        // Fungsi loginWithPassword tidak akan mengembalikan user, hanya resolve jika berhasil.
        await loginWithPassword(finalEmail, secret);
        router.push(nextHref);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Registrasi gagal.";
        // Tampilkan pesan bila username sudah terdaftar
        if (message.toLowerCase().includes("user already registered")) {
          setError("Username ini sudah terdaftar. Silakan gunakan Username lain.");
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
      return; // Stop the execution branch here
    } else {
      // password mode
      if (!isEmail) {
        setError("Harap masukkan format email yang valid.");
        setLoading(false);
        return;
      }
    }
    
    try {
      const result = await signUpWithPassword(finalEmail, secret, name);
      
      if (result.requiresEmailVerification) {
        setSuccessMsg("Pendaftaran berhasil! Link verifikasi telah dikirim ke email kamu. Silakan cek inbox/spam untuk mengaktifkan akun.");
        setName("");
        setIdentifier("");
        setSecret("");
        setConfirmSecret("");
      } else {
        router.push(nextHref);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registrasi gagal.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-md px-4 md:px-0">
      <div className="card-primary p-6 md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Daftar PAPin</p>
        <h1 className="mt-1 text-3xl font-black text-[#454545]">Buat Akun Baru</h1>
        <p className="mt-2 text-sm text-[#666]">
          Simpan hasil testmu dan akses fitur premium lainnya.
        </p>

        <div className="mt-6 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-black uppercase tracking-wider text-[#666]">Nama Lengkap</label>
            <input
              type="text"
              className="w-full rounded-xl border border-primary/20 px-3 py-3 outline-none focus:border-primary"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama kamu"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-black uppercase tracking-wider text-[#666]">
              {inputType === "password" ? "Email" : "Username"}
            </label>
            <input
              type={inputType === "password" ? "email" : "text"}
              className="w-full rounded-xl border border-primary/20 px-3 py-3 outline-none focus:border-primary"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value.toLowerCase().trim())}
              placeholder={inputType === "password" ? "you@email.com" : "Username kamu"}
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
                  setSecret("");
                  setConfirmSecret("");
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
                placeholder={inputType === "password" ? "Minimal 6 karakter" : "KODE-RAHASIA"}
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
          <div>
            <label className="mb-1 block text-xs font-black uppercase tracking-wider text-[#666]">
              Konfirmasi {inputType === "password" ? "Password" : "Paircode"}
            </label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                className="w-full rounded-xl border border-primary/20 pl-3 pr-10 py-3 outline-none focus:border-primary font-medium tracking-wide"
                value={confirmSecret}
                onChange={(event) => setConfirmSecret(event.target.value)}
                placeholder={inputType === "password" ? "Ulangi password kamu" : "Ulangi KODE-RAHASIA"}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {successMsg && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        {successMsg ? (
          <button
            type="button"
            onClick={() => router.push(`/login?next=${encodeURIComponent(nextHref)}`)}
            className="btn btn-primary-solid mt-6 w-full"
          >
            Lanjut ke Login
          </button>
        ) : (
          <button
            type="button"
            onClick={handleRegister}
            disabled={loading}
            className="btn btn-primary-solid mt-6 w-full"
          >
            {loading ? "Mendaftar..." : "Daftar Sekarang"}
          </button>
        )}

        <p className="mt-4 text-center text-xs text-[#888]">
          Sudah punya akun?{" "}
          <button 
            onClick={() => router.push(`/login?next=${encodeURIComponent(nextHref)}`)}
            className="font-bold text-primary hover:underline"
          >
            Login di sini
          </button>
        </p>
      </div>
    </section>
  );
}
