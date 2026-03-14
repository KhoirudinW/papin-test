import { NextResponse } from "next/server";
import type { TestCatalogRow } from "@/data/testsCatalog";
import { getAuthProfileFromRequest } from "@/lib/authServer";
import { isAdminProfile } from "@/lib/adminAccess";
import { getCatalogPromoSnapshot } from "@/lib/catalogPolicy";
import { getCatalogRows } from "@/lib/entitlement";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { AdminCatalogUpdatePayload } from "@/types/catalog";

const toSafeString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const toSafePrice = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.round(parsed));
    }
  }

  return null;
};

const assertAdmin = async (request: Request) => {
  const profile = await getAuthProfileFromRequest(request);

  if (!profile?.id) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Unauthorized." }, { status: 401 }),
    };
  }

  if (!isAdminProfile(profile)) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Akses admin ditolak." }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    profile,
  };
};

export async function GET(request: Request) {
  try {
    const auth = await assertAdmin(request);
    if (!auth.ok) {
      return auth.response;
    }

    const tests = await getCatalogRows({ includeInactive: true, includeHidden: true });

    return NextResponse.json({
      tests,
      promo: getCatalogPromoSnapshot(),
    });
  } catch (error: unknown) {
    console.error("Admin tests GET error:", error);
    return NextResponse.json(
      { message: "Gagal memuat dashboard admin." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await assertAdmin(request);
    if (!auth.ok) {
      return auth.response;
    }

    const body = (await request.json()) as Partial<AdminCatalogUpdatePayload>;
    const id = toSafeString(body.id);
    const title = toSafeString(body.title);
    const description = toSafeString(body.description);
    const price = toSafePrice(body.price);
    const isFree = typeof body.is_free === "boolean" ? body.is_free : null;
    const isActive = typeof body.is_active === "boolean" ? body.is_active : null;

    if (!id) {
      return NextResponse.json({ message: "ID test wajib diisi." }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ message: "Judul test wajib diisi." }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ message: "Deskripsi test wajib diisi." }, { status: 400 });
    }

    if (price === null) {
      return NextResponse.json({ message: "Harga harus berupa angka valid." }, { status: 400 });
    }

    if (isFree === null || isActive === null) {
      return NextResponse.json(
        { message: "Status free dan active wajib diisi." },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("tests_catalog")
      .update({
        title,
        description,
        price,
        is_free: isFree,
        is_active: isActive,
      })
      .eq("id", id)
      .select("id, slug, title, description, price, is_free, is_active")
      .single();

    if (error || !data) {
      throw error || new Error("Updated row not returned.");
    }

    return NextResponse.json({
      message: "Test berhasil diperbarui.",
      test: data as TestCatalogRow,
      promo: getCatalogPromoSnapshot(),
    });
  } catch (error: unknown) {
    console.error("Admin tests PATCH error:", error);
    return NextResponse.json(
      { message: "Gagal menyimpan perubahan test." },
      { status: 500 },
    );
  }
}
