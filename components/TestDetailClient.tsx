"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, Lock, UserPlus, LogIn } from "lucide-react";
import AttachmentReflectionUI from "@/components/AttachmentReflectionUI";
import LoveLanguageMappingUI from "@/components/LoveLanguageMappingUI";
import { useTestsCatalog } from "@/hooks/useTestsCatalog";
import { useAuthSession } from "@/hooks/useAuthSession";
import { usePathname, useSearchParams } from "next/navigation";

export default function TestDetailClient({ slug }: { slug: string }) {
  const { tests, loading, promo } = useTestsCatalog();
  const { isLoggedIn, loading: authLoading } = useAuthSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resultId = searchParams.get("resultId");

  const test = useMemo(() => tests.find((item) => item.slug === slug) ?? null, [slug, tests]);
  const locked = useMemo(() => test?.accessState === "locked", [test?.accessState]);

  if ((loading || authLoading) && !test) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 md:px-8">
        <div className="card-primary p-8">
          <p className="text-sm text-[#666]">Memuat akses test...</p>
        </div>
      </section>
    );
  }

  if (!test) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 md:px-8">
        <div className="card-primary p-8">
          <p className="text-sm text-[#666]">Test tidak ditemukan atau sedang tidak aktif.</p>
          <Link href="/" className="mt-3 inline-flex items-center gap-2 text-primary">
            <ArrowLeft size={14} /> Kembali ke menu
          </Link>
        </div>
      </section>
    );
  }

  if (!isLoggedIn) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 md:px-8">
        <div className="card-primary p-8 md:p-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock size={32} />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Akses Terbatas</p>
          <h1 className="mt-2 text-3xl font-black text-[#444]">Login untuk Mulai Test</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#666]">
            Satu langkah lagi! Silakan login atau daftar akun PAPin terlebih dahulu agar hasil testmu bisa tersimpan dengan aman.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link 
              href={`/login?next=${encodeURIComponent(pathname)}`} 
              className="btn btn-primary-solid flex items-center gap-2 px-8!"
            >
              <LogIn size={18} />
              Login
            </Link>
            <Link 
              href={`/register?next=${encodeURIComponent(pathname)}`} 
              className="btn btn-secondary-stroke flex items-center gap-2 px-8!"
            >
              <UserPlus size={18} />
              Daftar Akun
            </Link>
          </div>
          
          <Link href="/" className="mt-8 inline-flex items-center gap-2 text-xs font-bold text-[#888] hover:text-primary transition-colors">
            <ArrowLeft size={12} />
            Kembali ke Menu Utama
          </Link>
        </div>
      </section>
    );
  }

  if (locked) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 md:px-8">
        <div className="card-primary p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Locked Test</p>
          <h1 className="mt-1 text-3xl font-black text-[#444]">{test.title}</h1>
          <p className="mt-2 text-sm text-[#666]">
            Test ini premium. Kamu bisa unlock lewat pricing, subscription pair, atau pembelian test satuan.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/pricing" className="btn btn-primary-solid inline-flex items-center gap-2">
              <Lock size={14} />
              Buka Promo & Pricing
            </Link>
            <Link href="/" className="btn btn-secondary-stroke inline-flex items-center gap-2">
              <ArrowLeft size={14} />
              Kembali ke Menu
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (promo.active && (slug === "conflict-style" || slug === "emotional-needs")) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 md:px-8">
        <div className="card-primary p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Promo Access Active</p>
          <h1 className="mt-1 text-3xl font-black text-[#444]">{test.title}</h1>
          <p className="mt-2 text-sm text-[#666]">
            Akses sudah dibuka karena promo gratis aktif, tetapi konten soal untuk test ini masih placeholder dan belum
            siap ditampilkan.
          </p>
          <Link href="/" className="mt-4 inline-flex items-center gap-2 text-primary">
            <ArrowLeft size={14} />
            Kembali ke menu
          </Link>
        </div>
      </section>
    );
  }

  if (slug === "attachment-lite") {
    return <AttachmentReflectionUI initialVariant="lite" fixedVariant resultId={resultId || undefined} />;
  }

  if (slug === "attachment-pro") {
    return <AttachmentReflectionUI initialVariant="pro" fixedVariant resultId={resultId || undefined} />;
  }

  if (slug === "love-language-lite") {
    return <LoveLanguageMappingUI initialVariant="lite" fixedVariant resultId={resultId || undefined} />;
  }

  if (slug === "love-language-pro") {
    return <LoveLanguageMappingUI initialVariant="pro" fixedVariant resultId={resultId || undefined} />;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 md:px-8">
      <div className="card-primary p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Coming Soon</p>
        <h1 className="mt-1 text-3xl font-black text-[#444]">{test.title}</h1>
        <p className="mt-2 text-sm text-[#666]">
          Route sudah aktif dan akses sudah terbuka, namun konten soal untuk test ini belum diisi.
        </p>
        <Link href="/" className="mt-4 inline-flex items-center gap-2 text-primary">
          <ArrowLeft size={14} />
          Kembali ke menu
        </Link>
      </div>
    </section>
  );
}
