"use client";

import Link from "next/link";
import { Check, Clock3, Sparkles } from "lucide-react";
import { useTestsCatalog } from "@/hooks/useTestsCatalog";

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

export default function PricingClient() {
  const { tests, promo, loading, error } = useTestsCatalog();
  const premiumCatalog = tests.filter((test) => !test.is_free);
  const promoEndLabel = formatPromoDate(promo.endAt);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 md:px-8">
      <div className="card-primary p-5 md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Promo & Pricing</p>
        <h1 className="mt-1 text-3xl font-black text-[#444] md:text-4xl">
          {promo.active ? "Semua Test Lagi Gratis" : "Pricing PAPin Test"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#666]">
          Pricing sekarang sudah membaca katalog server yang sama dengan halaman test, jadi status free, active, dan
          premium konsisten dari satu sumber data.
        </p>

        {promo.active && (
          <div className="mt-6 rounded-[2rem] border border-green-200 bg-green-50 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">Campaign Aktif</p>
                <h2 className="mt-1 text-2xl font-black text-green-900 md:text-3xl">
                  Semua test gratis sampai {promoEndLabel}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-green-900/80">
                  Selama promo aktif, checkout premium dimatikan sementara. User bisa langsung masuk ke semua test tanpa
                  pembelian atau subscription.
                </p>
              </div>
              <span className="rounded-full bg-green-700 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                Free All Tests
              </span>
            </div>
          </div>
        )}

        {!promo.active && (
          <div className="mt-6 rounded-[2rem] border border-primary/20 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="rounded-full bg-primary/10 p-2 text-primary">
                <Clock3 size={18} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Sesudah Promo</p>
                <p className="mt-2 text-sm leading-relaxed text-[#666]">
                  Akses premium akan kembali mengikuti setting test di katalog, subscription pair, dan pembelian test
                  satuan yang sudah tercatat.
                </p>
              </div>
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
            Memuat pricing dan promo terkini...
          </p>
        )}

        <div className="mt-8">
          <p className="text-sm font-black text-[#555]">Test Premium di Katalog</p>
          <div className="mt-3 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {premiumCatalog.map((test) => {
              const accessible = test.accessState !== "locked";

              return (
                <article key={test.slug} className="flex flex-col rounded-[2rem] border border-primary/15 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xl font-black text-[#444]">{test.title}</p>
                    {promo.active && (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-[11px] font-black text-green-700">
                        Gratis
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-[#666]">{test.description}</p>

                  <div className="mt-4">
                    {promo.active ? (
                      <>
                        <p className="text-lg font-black text-green-700">Gratis selama promo</p>
                        <p className="text-sm text-[#999] line-through">{formatRupiah(test.price)}</p>
                      </>
                    ) : (
                      <p className="text-lg font-black text-primary">{formatRupiah(test.price)}</p>
                    )}
                  </div>

                  <ul className="mt-4 flex grow flex-col gap-2">
                    <li className="flex items-start gap-2 text-sm font-medium leading-relaxed text-[#555]">
                      <Check size={15} strokeWidth={3} className="mt-0.5 shrink-0 text-primary" />
                      <span>Akses mengikuti status `is_free`, promo aktif, dan entitlement user.</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm font-medium leading-relaxed text-[#555]">
                      <Check size={15} strokeWidth={3} className="mt-0.5 shrink-0 text-primary" />
                      <span>Kalau route soal sudah siap, user bisa langsung mulai dari halaman test.</span>
                    </li>
                  </ul>

                  <Link
                    href={accessible ? `/tests/${test.slug}` : "/login?next=%2Fpricing"}
                    className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${
                      accessible
                        ? "bg-primary text-white hover:bg-primary-hovered"
                        : "bg-[#fff4f9] text-primary hover:bg-primary/10"
                    }`}
                  >
                    {promo.active ? <Sparkles size={14} /> : null}
                    {accessible ? "Buka Test" : "Login untuk Akses"}
                  </Link>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-10 rounded-[2rem] border border-primary/20 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Catatan Operasional</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#666]">
            <li>Selama promo aktif, semua premium checkout ditahan agar user tidak membayar sesuatu yang sedang gratis.</li>
            <li>Setelah promo berakhir pada {promoEndLabel}, pricing kembali mengikuti setting test di dashboard admin.</li>
            <li>Admin bisa mengatur status free, active, price, dan copy test dari dashboard sederhana di route `/admin`.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
