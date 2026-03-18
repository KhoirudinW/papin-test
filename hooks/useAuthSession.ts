"use client";

// useAuthSession sekarang hanya re-export dari AuthContext
// agar semua komponen yang sudah pakai useAuthSession tidak perlu diubah
export { useAuthContext as useAuthSession } from "@/contexts/AuthContext";
export type { SessionProfile } from "@/contexts/AuthContext";
