import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const normalizeTransactionStatus = (status: string) => status.trim().toLowerCase();

export const isPaidTransaction = (status: string, fraudStatus?: string | null) => {
  const normalizedStatus = normalizeTransactionStatus(status);
  const normalizedFraud = (fraudStatus || "").trim().toLowerCase();

  if (normalizedStatus === "settlement") {
    return true;
  }

  if (normalizedStatus === "capture") {
    return !normalizedFraud || normalizedFraud === "accept";
  }

  if (normalizedStatus === "paid") {
    return true;
  }

  return false;
};

export const toIsoOrNull = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
};

const addOneMonthIso = (baseIso: string) => {
  const baseDate = new Date(baseIso);
  if (Number.isNaN(baseDate.getTime())) {
    return null;
  }

  const nextDate = new Date(baseDate);
  nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate.toISOString();
};

export const activatePairSubscription = async (
  pairId: string,
  planId: string,
  startDateIso?: string | null,
) => {
  const supabaseAdmin = getSupabaseAdmin();
  const startDate = toIsoOrNull(startDateIso) || new Date().toISOString();

  const { data: existingSubscription, error: existingError } = await supabaseAdmin
    .from("subscriptions")
    .select("id, status, end_date")
    .eq("pair_id", pairId)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  let billingStartDate = startDate;

  if (
    existingSubscription?.status === "active" &&
    existingSubscription?.end_date &&
    new Date(existingSubscription.end_date).getTime() > new Date(startDate).getTime()
  ) {
    billingStartDate = existingSubscription.end_date;
  }

  const nextEndDate = addOneMonthIso(billingStartDate);
  if (!nextEndDate) {
    throw new Error("Failed to build subscription end date.");
  }

  if (existingSubscription?.id) {
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        plan_id: planId,
        status: "active",
        start_date: startDate,
        end_date: nextEndDate,
        canceled_at: null,
      })
      .eq("id", existingSubscription.id);

    if (error) {
      throw error;
    }
    return;
  }

  const { error } = await supabaseAdmin.from("subscriptions").insert({
    pair_id: pairId,
    plan_id: planId,
    status: "active",
    start_date: startDate,
    end_date: nextEndDate,
    canceled_at: null,
  });

  if (error) {
    throw error;
  }
};
