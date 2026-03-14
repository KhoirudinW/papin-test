import { NextResponse } from "next/server";
import { getAuthProfileFromRequest } from "@/lib/authServer";
import { getMidtransCoreApi } from "@/lib/midtrans";
import {
  activatePairSubscription,
  isPaidTransaction,
  normalizeTransactionStatus,
  toIsoOrNull,
} from "@/lib/payment";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type ConfirmRequestBody = {
  orderId?: string;
  kind?: "subscription" | "test_purchase";
};

const getString = (value: unknown) => (typeof value === "string" ? value : "");

export async function POST(request: Request) {
  try {
    const profile = await getAuthProfileFromRequest(request);
    if (!profile?.id) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as ConfirmRequestBody;
    const orderId = (body.orderId || "").trim();
    const kind = body.kind;

    if (!orderId || !kind) {
      return NextResponse.json({ message: "orderId dan kind wajib diisi." }, { status: 400 });
    }

    const coreApi = getMidtransCoreApi();
    const transaction = await coreApi.transaction.status(orderId);

    const transactionStatus = getString((transaction as { transaction_status?: unknown }).transaction_status);
    const fraudStatus = getString((transaction as { fraud_status?: unknown }).fraud_status);
    const statusCode = getString((transaction as { status_code?: unknown }).status_code);
    const paymentType = getString((transaction as { payment_type?: unknown }).payment_type);
    const transactionId = getString((transaction as { transaction_id?: unknown }).transaction_id);
    const grossAmount = getString((transaction as { gross_amount?: unknown }).gross_amount);
    const transactionTime = getString((transaction as { transaction_time?: unknown }).transaction_time);
    const expiryTime = getString((transaction as { expiry_time?: unknown }).expiry_time);

    if (!transactionStatus) {
      return NextResponse.json(
        { message: "Status pembayaran dari Midtrans tidak valid." },
        { status: 502 },
      );
    }

    const normalizedStatus = normalizeTransactionStatus(transactionStatus);
    const isPaid = isPaidTransaction(transactionStatus, fraudStatus);
    const supabaseAdmin = getSupabaseAdmin();

    if (kind === "subscription") {
      const { data: payment, error } = await supabaseAdmin
        .from("payment_transactions")
        .select("id, pair_id, plan_id")
        .eq("order_id", orderId)
        .limit(1)
        .maybeSingle();

      if (error || !payment) {
        return NextResponse.json({ message: "Transaksi subscription tidak ditemukan." }, { status: 404 });
      }

      if (!profile.pair_id || profile.pair_id !== payment.pair_id) {
        return NextResponse.json({ message: "Akses transaksi ditolak." }, { status: 403 });
      }

      const { error: updateError } = await supabaseAdmin
        .from("payment_transactions")
        .update({
          transaction_status: normalizedStatus,
          status_code: statusCode || null,
          fraud_status: fraudStatus || null,
          payment_type: paymentType || null,
          midtrans_transaction_id: transactionId || null,
          gross_amount: grossAmount || null,
          transaction_time: toIsoOrNull(transactionTime),
          expires_at: toIsoOrNull(expiryTime),
          paid_at: isPaid ? toIsoOrNull(transactionTime) || new Date().toISOString() : null,
          raw_response: transaction as Record<string, unknown>,
        })
        .eq("id", payment.id);

      if (updateError) {
        throw updateError;
      }

      if (isPaid) {
        await activatePairSubscription(payment.pair_id, payment.plan_id, transactionTime);
      }
    } else {
      const { data: purchase, error } = await supabaseAdmin
        .from("test_purchases")
        .select("id, profile_id")
        .eq("order_id", orderId)
        .limit(1)
        .maybeSingle();

      if (error || !purchase) {
        return NextResponse.json({ message: "Transaksi test tidak ditemukan." }, { status: 404 });
      }

      if (purchase.profile_id !== profile.id) {
        return NextResponse.json({ message: "Akses transaksi ditolak." }, { status: 403 });
      }

      const { error: updateError } = await supabaseAdmin
        .from("test_purchases")
        .update({
          transaction_status: normalizedStatus,
          paid_at: isPaid ? toIsoOrNull(transactionTime) || new Date().toISOString() : null,
          raw_response: transaction as Record<string, unknown>,
        })
        .eq("id", purchase.id);

      if (updateError) {
        throw updateError;
      }
    }

    return NextResponse.json({
      message: isPaid ? "Pembayaran berhasil diverifikasi." : "Status pembayaran sudah diperbarui.",
      paymentStatus: normalizedStatus,
      activated: isPaid,
    });
  } catch (error: unknown) {
    console.error("Payment confirm error:", error);
    return NextResponse.json(
      { message: "Gagal konfirmasi status pembayaran." },
      { status: 500 },
    );
  }
}
