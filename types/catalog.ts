import type { AccessState, TestCatalogRow } from "@/data/testsCatalog";

export type CatalogPromoMode = "standard" | "free_all_tests";

export type CatalogPromoSnapshot = {
  active: boolean;
  mode: CatalogPromoMode;
  startAt: string | null;
  endAt: string | null;
};

export type CatalogApiUser = {
  id: string;
  pairId: string | null;
  email: string | null;
  fullName: string | null;
  name: string | null;
} | null;

export type CatalogWithAccessRow = TestCatalogRow & {
  accessState: AccessState;
};

export type CatalogApiResponse = {
  tests: CatalogWithAccessRow[];
  user: CatalogApiUser;
  promo: CatalogPromoSnapshot;
};

export type AdminCatalogApiResponse = {
  tests: TestCatalogRow[];
  promo: CatalogPromoSnapshot;
};

export type AdminCatalogUpdatePayload = {
  id: string;
  title: string;
  description: string;
  price: number;
  is_free: boolean;
  is_active: boolean;
};
