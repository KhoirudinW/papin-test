import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getAuthProfileFromRequest } from "@/lib/authServer";
import { isGlobalFreeAccessActive } from "@/lib/catalogPolicy";
import { getCatalogRows, resolveAccess } from "@/lib/entitlement";
import { getMidtransSnap } from "@/lib/midtrans";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type TokenRequestBody = {
  testSlug?: string;
};

const generateOrderId = (profileId: string) => {
  const compactProfile = profileId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const compactUuid = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `TEST-${compactProfile}-${Date.now()}-${compactUuid}`;
};

export async function POST(request: Request) {
  try {
    const profile = await getAuthProfileFromRequest(request);
    if (!profile?.id) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as TokenRequestBody;
    const testSlug = (body.testSlug || "").trim();
    if (!testSlug) {
      return NextResponse.json({ message: "testSlug wajib diisi." }, { status: 400 });
    }

    const catalog = await getCatalogRows();
    const selectedTest = catalog.find((test) => test.slug === testSlug);
    if (!selectedTest) {
      return NextResponse.json({ message: "Test tidak ditemukan." }, { status: 404 });
    }

    if (selectedTest.is_free || selectedTest.price <= 0 || isGlobalFreeAccessActive()) {
      return NextResponse.json(
        { message: "Test ini gratis, tidak perlu checkout." },
        { status: 400 },
      );
    }

    const accessState = await resolveAccess({
      profileId: profile.id,
      pairId: profile.pair_id,
      test: selectedTest,
    });

    if (accessState === "unlocked_by_subscription" || accessState === "purchased") {
      return NextResponse.json(
        { message: "Test ini sudah terbuka untuk akunmu." },
        { status: 409 },
      );
    }

    const finalAmount = Math.max(1, Math.round(selectedTest.price));
    const orderId = generateOrderId(profile.id);
    const snap = getMidtransSnap();

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: finalAmount,
      },
      item_details: [
        {
          id: selectedTest.id,
          price: finalAmount,
          quantity: 1,
          name: `PAPin Test: ${selectedTest.title}`,
        },
      ],
      custom_field1: profile.id,
      custom_field2: selectedTest.slug,
      custom_field3: "test_purchase",
    };

    const transaction = await snap.createTransaction(parameter);
    const token = transaction?.token as string | undefined;
    const redirectUrl = transaction?.redirect_url as string | undefined;

    if (!token) {
      return NextResponse.json(
        { message: "Gagal membuat token pembayaran test." },
        { status: 500 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error: insertError } = await supabaseAdmin.from("test_purchases").insert({
      order_id: orderId,
      test_id: selectedTest.id,
      profile_id: profile.id,
      pair_id: profile.pair_id,
      amount: finalAmount,
      currency: "IDR",
      transaction_status: "pending",
      raw_request: {
        ...parameter,
        kind: "test_purchase",
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
      test: {
        id: selectedTest.id,
        slug: selectedTest.slug,
        title: selectedTest.title,
        price: finalAmount,
      },
      kind: "test_purchase",
    });
  } catch (error: unknown) {
    console.error("Test token API error:", error);
    return NextResponse.json(
      { message: "Gagal membuat sesi pembayaran test." },
      { status: 500 },
    );
  }
}
