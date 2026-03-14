"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/useAuthSession";

export default function TestNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, profile, logout } = useAuthSession();

  const navItems = [
    { href: "/", label: "Main Menu" },
    { href: "/pricing", label: "Promo & Pricing" },
    ...(isLoggedIn ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-primary/20 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/assets/logo.png" alt="PAPin logo" width={42} height={42} />
          <div className="leading-tight">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Papin Test</p>
            <p className="text-sm font-bold text-[#444]">Multi Test Platform</p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href === "/admin" && pathname.startsWith("/admin"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  active ? "bg-primary text-white" : "text-[#565656] hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {isLoggedIn ? (
            <>
              <span className="max-w-48 truncate text-xs font-bold text-[#666]">
                Hi, {profile?.full_name || profile?.name || profile?.email || "User"}
              </span>
              <button
                type="button"
                className="btn btn-secondary-stroke !px-4 !py-2"
                onClick={async () => {
                  await logout();
                  router.push("/");
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link href={`/login?next=${encodeURIComponent(pathname || "/")}`} className="btn btn-primary-solid !px-4 !py-2">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
