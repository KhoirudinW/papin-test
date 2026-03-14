"use client";

import { useCallback, useEffect, useState } from "react";
import { fallbackCatalog, type AccessState } from "@/data/testsCatalog";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getAuthHeader } from "@/lib/clientAuth";
import type { CatalogApiResponse, CatalogPromoSnapshot, CatalogWithAccessRow } from "@/types/catalog";

const FALLBACK_PROMO_START_AT = "2026-03-14T00:00:00+07:00";
const FALLBACK_PROMO_END_AT = "2026-04-14T23:59:59.999+07:00";

const buildFallbackPromo = (): CatalogPromoSnapshot => {
  const now = Date.now();
  const startAt = new Date(FALLBACK_PROMO_START_AT).getTime();
  const endAt = new Date(FALLBACK_PROMO_END_AT).getTime();
  const active = Number.isFinite(startAt) && Number.isFinite(endAt) && now >= startAt && now <= endAt;

  return {
    active,
    mode: active ? "free_all_tests" : "standard",
    startAt: new Date(FALLBACK_PROMO_START_AT).toISOString(),
    endAt: new Date(FALLBACK_PROMO_END_AT).toISOString(),
  };
};

const buildFallbackTests = (promo: CatalogPromoSnapshot): CatalogWithAccessRow[] =>
  fallbackCatalog
    .filter((test) => test.is_active)
    .map((test) => ({
      ...test,
      accessState: (test.is_free || promo.active ? "free" : "locked") as AccessState,
    }));

export const useTestsCatalog = () => {
  const { user, loading: sessionLoading } = useAuthSession();

  const [promo, setPromo] = useState<CatalogPromoSnapshot>(() => buildFallbackPromo());
  const [tests, setTests] = useState<CatalogWithAccessRow[]>(() => buildFallbackTests(buildFallbackPromo()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch("/api/tests/catalog", {
        headers,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load catalog.");
      }

      const payload = (await response.json()) as CatalogApiResponse;
      const nextPromo = payload.promo || buildFallbackPromo();

      setPromo(nextPromo);
      setTests(payload.tests || buildFallbackTests(nextPromo));
    } catch (loadError) {
      console.error("Failed to load tests catalog:", loadError);
      const fallbackPromo = buildFallbackPromo();
      setPromo(fallbackPromo);
      setTests(buildFallbackTests(fallbackPromo));
      setError("Katalog sedang memakai fallback data karena akses server belum tersedia.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }

    void loadCatalog();
  }, [sessionLoading, user?.id, loadCatalog]);

  return {
    tests,
    promo,
    loading: loading || sessionLoading,
    error,
    refresh: loadCatalog,
  };
};
