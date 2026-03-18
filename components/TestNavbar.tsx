"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { Menu, X } from "lucide-react";

export default function TestNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, profile, logout } = useAuthSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { href: "/", label: "Main Menu" },
    { href: "/pricing", label: "Promo & Pricing" },
    ...(profile?.is_admin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/");
    setIsMenuOpen(false);
  };

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

        {/* Desktop Navigation */}
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
              <span className="max-w-48 truncate text-xs font-bold text-[#666] ml-2">
                Hi, {profile?.full_name || profile?.name || profile?.email || "User"}
              </span>
              <button
                type="button"
                className="btn btn-secondary-stroke px-4! py-2! ml-2"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 ml-2">
              <Link 
                href={`/register?next=${encodeURIComponent(pathname || "/")}`} 
                className="text-sm font-bold text-[#565656] hover:text-primary transition-colors"
              >
                Daftar
              </Link>
              <Link href={`/login?next=${encodeURIComponent(pathname || "/")}`} className="btn btn-primary-solid px-4! py-2!">
                Login
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[#565656] hover:bg-primary/10 hover:text-primary transition md:hidden active:scale-90 touch-manipulation"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="flex flex-col border-t border-primary/10 bg-white px-4 py-4 pb-6 shadow-xl space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href === "/admin" && pathname.startsWith("/admin"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                    active ? "bg-primary/10 text-primary" : "text-[#565656] hover:bg-primary/5 border border-transparent"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="my-2 border-t border-gray-100" />

            {isLoggedIn ? (
              <div className="flex flex-col gap-3 px-2">
                <span className="text-sm font-bold text-[#666] truncate pt-2">
                  Hi, {profile?.full_name || profile?.name || profile?.email || "User"}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary-stroke w-full justify-center"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 px-2 pt-2">
                <Link 
                  href={`/register?next=${encodeURIComponent(pathname || "/")}`} 
                  className="btn btn-secondary-stroke w-full justify-center"
                >
                  Daftar Sekarang
                </Link>
                <Link 
                  href={`/login?next=${encodeURIComponent(pathname || "/")}`} 
                  className="btn btn-primary-solid w-full justify-center"
                >
                  Login ke Akun
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
