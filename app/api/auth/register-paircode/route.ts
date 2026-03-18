import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const { identifier, secret, name } = await request.json();

    if (!identifier || !secret || !name) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Must be a virtual email
    const isEmail = identifier.includes("@");
    if (isEmail) {
      return NextResponse.json({ error: "Identifier cannot be an email when using paircode" }, { status: 400 });
    }

    const email = `${identifier.toLowerCase().trim()}@user.papin.local`;
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Check if user already exists
    // The admin API actually creates users. If they exist, it throws an error.
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: secret,
      email_confirm: true,
      user_metadata: {
        full_name: name,
      },
    });

    if (error) {
      // Typically: "User already registered" or "Password should be at least 6 characters"
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 2. Insert into user_profiles just in case the Postgres trigger takes too long or fails
    if (data.user) {
      await supabaseAdmin.from("user_profiles").upsert(
        {
          auth_user_id: data.user.id,
          email: data.user.email,
          full_name: name,
          name: name,
        },
        { onConflict: "auth_user_id", ignoreDuplicates: true }
      );
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
