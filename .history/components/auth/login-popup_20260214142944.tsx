"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

export function LoginPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.location.pathname.startsWith("/auth")) return false;
    return !sessionStorage.getItem("gifta-login-popup-shown");
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname.startsWith("/auth")) {
      setOpen(false);
      return;
    }

    if (open) {
      sessionStorage.setItem("gifta-login-popup-shown", "1");
    }
  }, [pathname, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-[#edd2d9] bg-white p-5 shadow-xl sm:p-6">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close login popup"
          className="absolute right-3 top-3 rounded-md border border-[#edd2d9] p-1.5 text-[#2f3a5e]"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#24438f]">Welcome to Gifta</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#24438f]">Sign in to continue</h2>
        <p className="mt-1 text-sm text-[#2f3a5e]/80">Track orders, save wishlist and enjoy faster checkout.</p>

        <form className="mt-5 space-y-3">
          <input
            type="email"
            placeholder="Email address"
            className="min-h-11 w-full rounded-lg border border-[#edd2d9] px-3 text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            className="min-h-11 w-full rounded-lg border border-[#edd2d9] px-3 text-sm"
          />
          <button type="button" className="min-h-11 w-full rounded-lg bg-[#24438f] px-4 text-sm font-semibold text-white">
            Sign in
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/auth/forgot-password" className="text-[#2f3a5e]/75 hover:text-[#24438f]" onClick={() => setOpen(false)}>
            Forgot password?
          </Link>
          <Link href="/auth/sign-up" className="font-medium text-[#24438f]" onClick={() => setOpen(false)}>
            Create account
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-4 w-full text-center text-sm font-medium text-[#2f3a5e]/75 hover:text-[#24438f]"
        >
          Continue as guest
        </button>
      </div>
    </div>
  );
}
