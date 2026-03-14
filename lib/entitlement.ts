import {
  fallbackCatalog,
  filterPublicCatalogRows,
  type AccessState,
  type TestCatalogRow,
} from "@/data/testsCatalog";
import { isGlobalFreeAccessActive } from "@/lib/catalogPolicy";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const isSubscriptionActive = async (pairId: string) => {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("status, end_date")
    .eq("pair_id", pairId)
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  if (data.status !== "active") {
    return false;
  }

  if (!data.end_date) {
    return true;
  }

  const endTime = new Date(data.end_date).getTime();
  return Number.isFinite(endTime) && endTime > Date.now();
};

const hasPaidTestPurchase = async (profileId: string, testId: string) => {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("test_purchases")
    .select("id")
    .eq("profile_id", profileId)
    .eq("test_id", testId)
    .in("transaction_status", ["settlement", "capture", "paid"])
    .limit(1)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data?.id);
};

export const resolveAccess = async ({
  profileId,
  pairId,
  test,
}: {
  profileId: string | null;
  pairId: string | null;
  test: TestCatalogRow;
}): Promise<AccessState> => {
  if (test.is_free || isGlobalFreeAccessActive()) {
    return "free";
  }

  if (!profileId) {
    return "locked";
  }

  if (pairId) {
    const unlockedBySubscription = await isSubscriptionActive(pairId);
    if (unlockedBySubscription) {
      return "unlocked_by_subscription";
    }
  }

  const purchased = await hasPaidTestPurchase(profileId, test.id);
  return purchased ? "purchased" : "locked";
};

export const getCatalogRows = async ({
  includeInactive = false,
  includeHidden = false,
}: {
  includeInactive?: boolean;
  includeHidden?: boolean;
} = {}) => {
  const supabaseAdmin = getSupabaseAdmin();
  let query = supabaseAdmin
    .from("tests_catalog")
    .select("id, slug, title, description, price, is_free, is_active")
    .order("created_at", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    const fallbackRows = fallbackCatalog.filter((test) => (includeInactive ? true : test.is_active));
    return includeHidden ? fallbackRows : filterPublicCatalogRows(fallbackRows);
  }

  const rows = data as TestCatalogRow[];
  return includeHidden ? rows : filterPublicCatalogRows(rows);
};
