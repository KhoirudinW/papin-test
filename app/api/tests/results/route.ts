import { NextResponse } from "next/server";
import { getAuthProfileFromRequest } from "@/lib/authServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { TestResultRow, SaveTestResultPayload } from "@/types/results";

export async function GET(request: Request) {
  try {
    const profile = await getAuthProfileFromRequest(request);

    if (!profile?.id) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("test_results")
      .select("*")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ results: data as TestResultRow[] });
  } catch (error: unknown) {
    console.error("Test results GET error:", error);
    return NextResponse.json(
      { message: "Gagal memuat riwayat test." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getAuthProfileFromRequest(request);

    if (!profile?.id) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as SaveTestResultPayload;

    if (!body.test_slug || !body.score_data) {
      return NextResponse.json(
        { message: "Data test tidak lengkap." },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("test_results")
      .insert({
        profile_id: profile.id,
        test_slug: body.test_slug,
        variant: body.variant || null,
        score_data: body.score_data,
        answers: body.answers || {},
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      message: "Hasil test berhasil disimpan.",
      result: data as TestResultRow,
    });
  } catch (error: unknown) {
    console.error("Test results POST error:", error);
    return NextResponse.json(
      { message: "Gagal menyimpan hasil test." },
      { status: 500 },
    );
  }
}
