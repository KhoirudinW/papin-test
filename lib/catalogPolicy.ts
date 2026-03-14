import type { CatalogPromoSnapshot } from "@/types/catalog";

const DEFAULT_FREE_ALL_START_AT = "2026-03-14T00:00:00+07:00";
const DEFAULT_FREE_ALL_END_AT = "2026-04-14T23:59:59.999+07:00";

const normalizeEnv = (value?: string | null) => value?.trim() || null;

const toValidDate = (value: string | null) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

export const getCatalogPromoSnapshot = (now = new Date()): CatalogPromoSnapshot => {
  const configuredStartAt = normalizeEnv(process.env.TEST_FREE_ALL_START_AT) || DEFAULT_FREE_ALL_START_AT;
  const configuredEndAt = normalizeEnv(process.env.TEST_FREE_ALL_END_AT) || DEFAULT_FREE_ALL_END_AT;

  const startAt = toValidDate(configuredStartAt);
  const endAt = toValidDate(configuredEndAt);

  const active =
    Boolean(startAt && endAt) &&
    now.getTime() >= startAt.getTime() &&
    now.getTime() <= endAt.getTime();

  return {
    active,
    mode: active ? "free_all_tests" : "standard",
    startAt: startAt ? startAt.toISOString() : null,
    endAt: endAt ? endAt.toISOString() : null,
  };
};

export const isGlobalFreeAccessActive = (now = new Date()) => getCatalogPromoSnapshot(now).active;
