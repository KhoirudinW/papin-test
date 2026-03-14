import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type AuthProfile = {
  id: string;
  pair_id: string | null;
  auth_user_id: string | null;
  email: string | null;
  full_name: string | null;
  name: string | null;
};

const extractBearerToken = (request: Request): string | null => {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!authHeader) {
    return null;
  }

  const [type, token] = authHeader.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
};

export const getAuthProfileFromRequest = async (request: Request): Promise<AuthProfile | null> => {
  const token = extractBearerToken(request);
  if (!token) {
    return null;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user?.id) {
    return null;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .select("id, pair_id, auth_user_id, email, full_name, name")
    .eq("auth_user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  return profile as AuthProfile;
};
