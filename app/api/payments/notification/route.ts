import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { getMidtransCoreApi, midtransServerKey } from "@/lib/midtrans";
import {
  activatePairSubscription,
  isPaidTransaction,
  normalizeTransactionStatus,
  toIsoOrNull,
} from "@/lib/payment";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const getString = (value: unknown) => (typeof value === "string" ? value : "");

const buildMidtransSignature = (orderId: string, statusCode: string, grossAmount: string) => {
  const source = `${orderId}${statusCode}${grossAmount}${midtransServerKey}`;
  return createHash("sha512").update(source).digest("hex");
};

export async function POST(request: Request) {
  try {
    if (!midtransServerKey) {
      return NextResponse.json({ message: "Midtrans server key belum diset." }, { status: 500 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const orderId = getString(payload.order_id).trim();
    const statusCode = getString(payload.status_code).trim();
    const grossAmount = getString(payload.gross_amount).trim();
    const signatureKey = getString(payload.signature_key).trim();

    if (!orderId || !statusCode || !grossAmount || !signatureKey) {
      return NextResponse.json({ message: "Payload Midtrans tidak lengkap." }, { status: 400 });
    }

    const expectedSignature = buildMidtransSignature(orderId, statusCode, grossAmount);
    if (signatureKey !== expectedSignature) {
      return NextResponse.json({ message: "Signature Midtrans tidak valid." }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const coreApi = getMidtransCoreApi();
    const transaction = await coreApi.transaction.status(orderId);

    const transactionStatus = getString((transaction as { transaction_status?: unknown }).transaction_status);
    const fraudStatus = getString((transaction as { fraud_status?: unknown }).fraud_status);
    const transactionTime = getString((transaction as { transaction_time?: unknown }).transaction_time);

    if (!transactionStatus) {
      return NextResponse.json({ message: "Status transaksi Midtrans tidak valid." }, { status: 502 });
    }

    const normalizedStatus = normalizeTransactionStatus(transactionStatus);
    const isPaid = isPaidTransaction(transactionStatus, fraudStatus);
    const paidAt = isPaid ? toIsoOrNull(transactionTime) || new Date().toISOString() : null;

    const { data: subRow } = await supabaseAdmin
      .from("payment_transactions")
      .select("id, pair_id, plan_id")
      .eq("order_id", orderId)
      .limit(1)
      .maybeSingle();

    if (subRow?.id) {
      await supabaseAdmin
        .from("payment_transactions")
        .update({
          transaction_status: normalizedStatus,
          status_code: statusCode || null,
          gross_amount: grossAmount || null,
          fraud_status: fraudStatus || null,
          transaction_time: toIsoOrNull(transactionTime),
          paid_at: paidAt,
          raw_response: transaction as Record<string, unknown>,
        })
        .eq("id", subRow.id);

      if (isPaid) {
        await activatePairSubscription(subRow.pair_id, subRow.plan_id, transactionTime);
      }

      return NextResponse.json({
        message: "Notifikasi subscription diterima.",
        paymentStatus: normalizedStatus,
      });
    }

    const { data: testRow } = await supabaseAdmin
      .from("test_purchases")
      .select("id")
      .eq("order_id", orderId)
      .limit(1)
      .maybeSingle();

    if (testRow?.id) {
      await supabaseAdmin
        .from("test_purchases")
        .update({
          transaction_status: normalizedStatus,
          paid_at: paidAt,
          raw_response: transaction as Record<string, unknown>,
        })
        .eq("id", testRow.id);

      return NextResponse.json({
        message: "Notifikasi pembelian test diterima.",
        paymentStatus: normalizedStatus,
      });
    }

    return NextResponse.json({
      message: "Order tidak terdaftar di papin-test. Notifikasi diabaikan.",
    });
  } catch (error: unknown) {
    console.error("Midtrans notification error:", error);
    return NextResponse.json(
      { message: "Gagal memproses notifikasi Midtrans." },
      { status: 500 },
    );
  }
}
