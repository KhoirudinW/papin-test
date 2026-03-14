import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getAuthProfileFromRequest } from "@/lib/authServer";
import { isGlobalFreeAccessActive } from "@/lib/catalogPolicy";
import { getMidtransSnap } from "@/lib/midtrans";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type TokenRequestBody = {
  planId?: string;
};

const toPositiveNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
};

const generateOrderId = (pairId: string) => {
  const compactPair = pairId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const compactUuid = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `SUB-${compactPair}-${Date.now()}-${compactUuid}`;
};

export async function POST(request: Request) {
  try {
    if (isGlobalFreeAccessActive()) {
      return NextResponse.json(
        { message: "Checkout subscription dimatikan selama promo gratis semua test masih aktif." },
        { status: 409 },
      );
    }

    const profile = await getAuthProfileFromRequest(request);
    if (!profile?.id) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    if (!profile.pair_id) {
      return NextResponse.json(
        { message: "Akun kamu belum terhubung pair. Subscription butuh pair aktif." },
        { status: 409 },
      );
    }

    const body = (await request.json()) as TokenRequestBody;
    const planId = (body.planId || "").trim();
    if (!planId) {
      return NextResponse.json({ message: "planId wajib diisi." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: plan, error: planError } = await supabaseAdmin
      .from("plans")
      .select("id, name, price, description")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ message: "Plan tidak ditemukan." }, { status: 404 });
    }

    const amount = toPositiveNumber(plan.price);
    if (!amount) {
      return NextResponse.json(
        { message: "Plan ini tidak memerlukan pembayaran." },
        { status: 400 },
      );
    }

    const finalAmount = Math.max(1, Math.round(amount));
    const orderId = generateOrderId(profile.pair_id);
    const snap = getMidtransSnap();

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: finalAmount,
      },
      item_details: [
        {
          id: plan.id,
          price: finalAmount,
          quantity: 1,
          name: `Subscription PAPin Test: ${plan.name}`,
        },
      ],
      custom_field1: profile.pair_id,
      custom_field2: plan.id,
      custom_field3: "subscription",
    };

    const transaction = await snap.createTransaction(parameter);
    const token = transaction?.token as string | undefined;
    const redirectUrl = transaction?.redirect_url as string | undefined;

    if (!token) {
      return NextResponse.json(
        { message: "Gagal membuat token pembayaran." },
        { status: 500 },
      );
    }

    const { error: insertError } = await supabaseAdmin.from("payment_transactions").insert({
      order_id: orderId,
      pair_id: profile.pair_id,
      plan_id: plan.id,
      amount: finalAmount,
      currency: "IDR",
      transaction_status: "pending",
      snap_token: token,
      snap_redirect_url: redirectUrl || null,
      raw_request: {
        ...parameter,
        kind: "subscription",
        profileId: profile.id,
      },
      raw_response: transaction || {},
    });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      token,
      orderId,
      redirectUrl: redirectUrl || null,
      plan: {
        id: plan.id,
        name: plan.name,
        price: finalAmount,
      },
      kind: "subscription",
    });
  } catch (error: unknown) {
    console.error("Subscription token API error:", error);
    return NextResponse.json(
      { message: "Gagal membuat sesi pembayaran subscription." },
      { status: 500 },
    );
  }
}
