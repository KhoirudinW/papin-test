import { NextResponse } from "next/server";
import type { AccessState } from "@/data/testsCatalog";
import { getAuthProfileFromRequest } from "@/lib/authServer";
import { getCatalogPromoSnapshot } from "@/lib/catalogPolicy";
import { getCatalogRows, resolveAccess } from "@/lib/entitlement";

export async function GET(request: Request) {
  try {
    const profile = await getAuthProfileFromRequest(request);
    const tests = await getCatalogRows();

    const withAccess = await Promise.all(
      tests.map(async (test) => {
        const accessState: AccessState = await resolveAccess({
          profileId: profile?.id || null,
          pairId: profile?.pair_id || null,
          test,
        });

        return {
          ...test,
          accessState,
        };
      }),
    );

    return NextResponse.json({
      tests: withAccess,
      promo: getCatalogPromoSnapshot(),
      user: profile
        ? {
            id: profile.id,
            pairId: profile.pair_id,
            email: profile.email,
            fullName: profile.full_name,
            name: profile.name,
          }
        : null,
    });
  } catch (error: unknown) {
    console.error("Catalog API error:", error);
    return NextResponse.json(
      { message: "Gagal memuat katalog test." },
      { status: 500 },
    );
  }
}
