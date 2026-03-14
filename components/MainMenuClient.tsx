"use client";

import Link from "next/link";
import { ArrowRight, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { type AccessState } from "@/data/testsCatalog";
import { useTestsCatalog } from "@/hooks/useTestsCatalog";

const badgeByAccess: Record<AccessState, string> = {
  free: "Free",
  unlocked_by_subscription: "Unlocked by Subscription",
  purchased: "Purchased",
  locked: "Locked",
};

const badgeStyleByAccess: Record<AccessState, string> = {
  free: "bg-green-50 text-green-700 border-green-200",
  unlocked_by_subscription: "bg-blue-50 text-blue-700 border-blue-200",
  purchased: "bg-emerald-50 text-emerald-700 border-emerald-200",
  locked: "bg-amber-50 text-amber-700 border-amber-200",
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatPromoDate = (value: string | null) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};

export default function MainMenuClient() {
  const { tests, promo, loading, error } = useTestsCatalog();
  const promoEndLabel = formatPromoDate(promo.endAt);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 md:px-8">
      <div className="card-primary p-5 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Main Menu</p>
            <h1 className="mt-1 text-3xl font-black text-[#434343] md:text-4xl">PAPin Test Library</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#666]">
              Pilih test refleksi yang ingin kamu kerjakan. Status akses sekarang langsung mengikuti katalog server,
              promo aktif, subscription pair, dan pembelian test satuan.
            </p>
          </div>

          <Link href="/pricing" className="btn btn-primary-solid inline-flex items-center gap-2">
            Promo & Pricing
            <ArrowRight size={14} />
          </Link>
        </div>

        {promo.active && (
          <div className="mt-6 rounded-[1.75rem] border border-green-200 bg-green-50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">Promo Gratis 1 Bulan</p>
                <h2 className="mt-1 text-2xl font-black text-green-900">Semua test gratis sampai {promoEndLabel}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-green-900/80">
                  Selama promo aktif, semua test terbuka untuk semua user tanpa checkout. Setelah promo berakhir, akses
                  kembali mengikuti setting katalog dan entitlement premium.
                </p>
              </div>
              <span className="rounded-full bg-green-700 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                Free All Tests
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {loading && (
          <p className="mt-5 text-sm font-semibold text-[#777]">
            Memuat katalog dan status akses terbaru...
          </p>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {tests.map((test) => {
            const isLocked = test.accessState === "locked";
            const hasPromoFree = promo.active && !test.is_free;
            const badgeLabel = hasPromoFree ? `Gratis sampai ${promoEndLabel}` : badgeByAccess[test.accessState];

            return (
              <article key={test.slug} className="rounded-2xl border border-primary/20 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-black text-[#4a4a4a]">{test.title}</h2>
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-black ${
                      hasPromoFree ? "border-green-200 bg-green-50 text-green-700" : badgeStyleByAccess[test.accessState]
                    }`}
                  >
                    {badgeLabel}
                  </span>
                </div>

                <p className="mt-2 text-sm text-[#666]">{test.description}</p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    {hasPromoFree ? (
                      <>
                        <p className="text-sm font-bold text-green-700">Gratis selama promo</p>
                        <p className="text-xs text-[#888] line-through">{formatRupiah(test.price)}</p>
                      </>
                    ) : (
                      <p className="text-sm font-bold text-primary">
                        {test.is_free ? "Gratis" : formatRupiah(test.price)}
                      </p>
                    )}
                  </div>

                  <Link
                    href={isLocked ? "/pricing" : `/tests/${test.slug}`}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition ${
                      isLocked
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "bg-primary text-white hover:bg-primary-hovered"
                    }`}
                  >
                    {isLocked ? (
                      <>
                        <Lock size={14} />
                        Lihat Akses
                      </>
                    ) : (
                      <>
                        {hasPromoFree ? <Sparkles size={14} /> : <ShieldCheck size={14} />}
                        Start
                      </>
                    )}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
