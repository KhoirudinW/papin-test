type ProfileLike = {
  email?: string | null;
  role?: string | null;
  is_admin?: boolean;
};

const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() || "";

const getAdminEmails = () =>
  (process.env.TEST_ADMIN_EMAILS || "")
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);

export const isAdminProfile = (profile: ProfileLike | null) => {
  // Cek flag is_admin (dari tabel test_admins via getAuthProfileFromRequest)
  if (profile?.is_admin === true) {
    return true;
  }

  // Fallback: cek email whitelist dari env
  const email = normalizeEmail(profile?.email);
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(email);
};
