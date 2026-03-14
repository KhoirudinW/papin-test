type ProfileLike = {
  email?: string | null;
};

const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() || "";

const getAdminEmails = () =>
  (process.env.TEST_ADMIN_EMAILS || "")
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);

export const isAdminProfile = (profile: ProfileLike | null) => {
  const email = normalizeEmail(profile?.email);
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(email);
};
