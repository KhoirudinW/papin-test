"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Settings2, ShieldCheck, Sparkles } from "lucide-react";
import { type TestCatalogRow } from "@/data/testsCatalog";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getAuthHeader } from "@/lib/clientAuth";
import type {
  AdminCatalogApiResponse,
  AdminCatalogUpdatePayload,
  CatalogPromoSnapshot,
} from "@/types/catalog";

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

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const emptyPromo: CatalogPromoSnapshot = {
  active: false,
  mode: "standard",
  startAt: null,
  endAt: null,
};

type SaveState = {
  pending?: boolean;
  success?: string;
  error?: string;
};

export default function AdminDashboardClient() {
  const { isLoggedIn, loading: sessionLoading, profile } = useAuthSession();
  const [tests, setTests] = useState<TestCatalogRow[]>([]);
  const [promo, setPromo] = useState<CatalogPromoSnapshot>(emptyPromo);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    setAccessDenied(false);

    try {
      const headers = await getAuthHeader();
      const response = await fetch("/api/admin/tests", {
        method: "GET",
        headers,
        cache: "no-store",
      });

      if (response.status === 403) {
        setAccessDenied(true);
        setTests([]);
        return;
      }

      if (response.status === 401) {
        setError("Sesi login belum tersedia. Silakan login ulang.");
        setTests([]);
        return;
      }

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || "Gagal memuat data admin.");
      }

      const payload = (await response.json()) as AdminCatalogApiResponse;
      setTests(payload.tests || []);
      setPromo(payload.promo || emptyPromo);
    } catch (loadError) {
      console.error("Failed to load admin dashboard:", loadError);
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat dashboard admin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }

    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    void loadDashboard();
  }, [isLoggedIn, loadDashboard, sessionLoading]);

  const stats = useMemo(() => {
    const total = tests.length;
    const active = tests.filter((test) => test.is_active).length;
    const free = tests.filter((test) => test.is_free).length;

    return {
      total,
      active,
      free,
      premium: total - free,
    };
  }, [tests]);

  const updateField = <K extends keyof TestCatalogRow,>(id: string, field: K, value: TestCatalogRow[K]) => {
    setTests((current) =>
      current.map((test) => (test.id === id ? { ...test, [field]: value } : test)),
    );
    setSaveStates((current) => ({
      ...current,
      [id]: {
        ...current[id],
        success: "",
        error: "",
      },
    }));
  };

  const saveRow = async (test: TestCatalogRow) => {
    setSaveStates((current) => ({
      ...current,
      [test.id]: {
        pending: true,
        success: "",
        error: "",
      },
    }));

    try {
      const headers = await getAuthHeader();
      const response = await fetch("/api/admin/tests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          id: test.id,
          title: test.title,
          description: test.description,
          price: test.price,
          is_free: test.is_free,
          is_active: test.is_active,
        } satisfies AdminCatalogUpdatePayload),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; test?: TestCatalogRow; promo?: CatalogPromoSnapshot }
        | null;

      if (!response.ok || !payload?.test) {
        throw new Error(payload?.message || "Gagal menyimpan perubahan.");
      }

      setTests((current) =>
        current.map((item) => (item.id === test.id ? payload.test || item : item)),
      );
      if (payload.promo) {
        setPromo(payload.promo);
      }

      setSaveStates((current) => ({
        ...current,
        [test.id]: {
          pending: false,
          success: payload.message || "Perubahan berhasil disimpan.",
          error: "",
        },
      }));
    } catch (saveError) {
      console.error("Failed to save catalog row:", saveError);
      setSaveStates((current) => ({
        ...current,
        [test.id]: {
          pending: false,
          success: "",
          error: saveError instanceof Error ? saveError.message : "Gagal menyimpan perubahan.",
        },
      }));
    }
  };

  if (sessionLoading) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 md:px-8">
        <div className="card-primary p-8">
          <p className="text-sm text-[#666]">Menyiapkan sesi admin...</p>
        </div>
      </section>
    );
  }

  if (!isLoggedIn) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 md:px-8">
        <div className="card-primary p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Admin Area</p>
          <h1 className="mt-1 text-3xl font-black text-[#444]">Login dibutuhkan</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#666]">
            Dashboard admin hanya bisa diakses setelah login memakai akun admin yang terdaftar di environment.
          </p>
          <Link href="/login?next=%2Fadmin" className="btn btn-primary-solid mt-5 inline-flex">
            Login sebagai Admin
          </Link>
        </div>
      </section>
    );
  }

  if (accessDenied) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 md:px-8">
        <div className="card-primary p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Admin Area</p>
          <h1 className="mt-1 text-3xl font-black text-[#444]">Akses admin ditolak</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#666]">
            Akun {profile?.email || "ini"} sudah login, tapi belum masuk daftar `TEST_ADMIN_EMAILS`.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 md:px-8">
      <div className="card-primary p-5 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Admin Dashboard</p>
            <h1 className="mt-1 text-3xl font-black text-[#444] md:text-4xl">Kontrol katalog test</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#666]">
              Atur test mana yang gratis, aktif, judulnya apa, dan harga dasarnya berapa. Semua perubahan ini akan
              dipakai setelah promo global selesai.
            </p>
          </div>

          <button type="button" onClick={() => void loadDashboard()} className="btn btn-secondary-stroke inline-flex gap-2">
            <Settings2 size={16} />
            Refresh Data
          </button>
        </div>

        {promo.active && (
          <div className="mt-6 rounded-[1.75rem] border border-green-200 bg-green-50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">Promo Global Aktif</p>
                <h2 className="mt-1 text-2xl font-black text-green-900">
                  Semua test gratis sampai {formatPromoDate(promo.endAt)}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-green-900/80">
                  Toggle `Gratis` per test tetap bisa diubah dari dashboard ini, tapi selama promo global aktif semua
                  test tetap terbuka untuk semua user.
                </p>
              </div>
              <span className="rounded-full bg-green-700 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                Promo Override
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-primary/15 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Total Test</p>
            <p className="mt-2 text-3xl font-black text-[#444]">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-primary/15 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Aktif</p>
            <p className="mt-2 text-3xl font-black text-[#444]">{stats.active}</p>
          </div>
          <div className="rounded-2xl border border-primary/15 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Free Setelah Promo</p>
            <p className="mt-2 text-3xl font-black text-[#444]">{stats.free}</p>
          </div>
          <div className="rounded-2xl border border-primary/15 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Premium Setelah Promo</p>
            <p className="mt-2 text-3xl font-black text-[#444]">{stats.premium}</p>
          </div>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-[#666]">Memuat data katalog admin...</p>
        ) : (
          <div className="mt-8 space-y-4">
            {tests.map((test) => {
              const saveState = saveStates[test.id] || {};

              return (
                <article key={test.id} className="rounded-[1.75rem] border border-primary/15 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-[#444]">{test.title}</h2>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
                          {test.slug}
                        </span>
                        {test.is_free && (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-[11px] font-black text-green-700">
                            Free
                          </span>
                        )}
                        {test.is_active ? (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-700">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-[#666]">
                        Base price: {formatRupiah(test.price)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void saveRow(test)}
                      disabled={Boolean(saveState.pending)}
                      className="btn btn-primary-solid inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ShieldCheck size={15} />
                      {saveState.pending ? "Menyimpan..." : "Simpan"}
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-[#666]">Judul</span>
                      <input
                        value={test.title}
                        onChange={(event) => updateField(test.id, "title", event.target.value)}
                        className="w-full rounded-xl border border-primary/15 bg-white px-4 py-3 text-sm text-[#444] outline-none transition focus:border-primary"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-[#666]">Harga Dasar</span>
                      <input
                        type="number"
                        min={0}
                        value={test.price}
                        onChange={(event) => updateField(test.id, "price", Math.max(0, Number(event.target.value) || 0))}
                        className="w-full rounded-xl border border-primary/15 bg-white px-4 py-3 text-sm text-[#444] outline-none transition focus:border-primary"
                      />
                    </label>
                  </div>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-[#666]">Deskripsi</span>
                    <textarea
                      value={test.description}
                      onChange={(event) => updateField(test.id, "description", event.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-primary/15 bg-white px-4 py-3 text-sm text-[#444] outline-none transition focus:border-primary"
                    />
                  </label>

                  <div className="mt-4 flex flex-wrap gap-5">
                    <label className="inline-flex items-center gap-3 text-sm font-bold text-[#555]">
                      <input
                        type="checkbox"
                        checked={test.is_free}
                        onChange={(event) => updateField(test.id, "is_free", event.target.checked)}
                        className="h-4 w-4 rounded border-primary/30 text-primary focus:ring-primary"
                      />
                      Gratis setelah promo
                    </label>

                    <label className="inline-flex items-center gap-3 text-sm font-bold text-[#555]">
                      <input
                        type="checkbox"
                        checked={test.is_active}
                        onChange={(event) => updateField(test.id, "is_active", event.target.checked)}
                        className="h-4 w-4 rounded border-primary/30 text-primary focus:ring-primary"
                      />
                      Aktif di katalog
                    </label>
                  </div>

                  {(saveState.success || saveState.error) && (
                    <div
                      className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                        saveState.error
                          ? "border border-rose-200 bg-rose-50 text-rose-700"
                          : "border border-green-200 bg-green-50 text-green-700"
                      }`}
                    >
                      {saveState.error || saveState.success}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-8 rounded-[1.75rem] border border-primary/15 bg-[#fffaf5] p-5">
          <div className="flex items-start gap-3">
            <span className="rounded-full bg-primary/10 p-2 text-primary">
              <Sparkles size={18} />
            </span>
            <div className="text-sm leading-relaxed text-[#666]">
              <p className="font-black text-[#444]">Catatan operasional</p>
              <p className="mt-2">
                Dashboard ini mengatur state katalog yang dipakai di halaman utama, pricing, dan detail test. Promo
                gratis 1 bulan dikontrol dari env `TEST_FREE_ALL_START_AT` dan `TEST_FREE_ALL_END_AT`, jadi override
                global-nya tetap aman dari sisi server.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
