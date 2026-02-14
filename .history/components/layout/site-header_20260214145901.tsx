"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CircleDollarSign,
  Heart,
  Menu,
  Search,
  ShoppingCart,
  UserCircle2,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/features/cart/store";
import { useWishlistStore } from "@/features/wishlist/store";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/store", label: "Store" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/cart", label: "Cart" },
];

function isActiveLink(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const cartCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );
  const wishlistCount = useWishlistStore((state) => state.productIds.length);

  return (
    <header className="sticky top-0 z-40 border-b border-[#d6d6d6] bg-[#f3f3f3]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-3 py-3 sm:px-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 lg:gap-4">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#2e2e2e] transition hover:bg-[#e5e5e5]"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <Link href="/" className="text-3xl font-black leading-none tracking-tight text-[#f1467d]">
            GIFTA
          </Link>

          <button
            type="button"
            className="hidden min-h-11 items-center gap-2 rounded-xl border border-[#d6caef] bg-[#ece6fb] px-3 text-sm text-[#5d4299] sm:inline-flex"
          >
            <span className="text-lg" role="img" aria-label="India">
              🇮🇳
            </span>
            <span className="font-medium">Where to deliver?</span>
          </button>
        </div>

        <form action="/store" method="get" className="hidden max-w-2xl flex-1 lg:block">
          <div className="relative">
            <input
              name="q"
              placeholder="Search for gifts"
              className="h-12 w-full rounded-full border border-[#bcbcbc] bg-white pl-5 pr-12 text-[1.75rem] text-sm text-[#2c2c2c] outline-none placeholder:text-[#666] focus:border-[#8f8f8f]"
            />
            <Search className="pointer-events-none absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#2f2f2f]" />
          </div>
        </form>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/store" className="hidden rounded-md border border-[#c5b77e] bg-white px-2 py-1 text-[1.75rem] text-sm font-bold text-[#2c2c2c] lg:inline-flex">
            <span>Get</span>
            <span className="mx-1 rounded-md bg-[#e4c25f] px-1.5 text-white">Select</span>
            <span className="text-[#e4c25f]">›</span>
          </Link>

          <IconLink href="/orders" label="Delivery date" icon={CalendarDays} />
          <IconLink href="/store" label="Currency" icon={CircleDollarSign} />

          <Link href="/wishlist" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#262626] transition hover:bg-[#e5e5e5]" aria-label="Wishlist">
            <Heart className="h-6 w-6" />
            {wishlistCount > 0 && <CountBadge value={wishlistCount} />}
          </Link>

          <Link href="/cart" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#262626] transition hover:bg-[#e5e5e5]" aria-label="Cart">
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && <CountBadge value={cartCount} />}
          </Link>

          <IconLink href="/account" label="Account" icon={UserCircle2} />
        </div>
      </div>

      <div className="border-t border-[#dddddd] bg-[#f8f8f8] px-3 py-3 lg:hidden sm:px-5">
        <form action="/store" method="get" className="mx-auto max-w-[1280px]">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2f2f2f]/70" />
            <input
              name="q"
              placeholder="Search for gifts"
              className="min-h-11 w-full rounded-full border border-[#bcbcbc] bg-white pl-10 pr-3 text-sm text-[#2c2c2c] outline-none placeholder:text-[#666] focus:border-[#8f8f8f]"
            />
          </div>
        </form>
      </div>

      {open && (
        <div className="border-t border-[#efc1d2] bg-linear-to-r from-[#ffe7f0] via-[#ffd9e8] to-[#ffcfdf] px-4 py-4 shadow-[0_12px_28px_rgba(239,63,122,0.14)]">
          <nav className="mx-auto grid max-w-[1280px] gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-md border border-[#efb7cc] bg-white/75 px-3 text-sm font-medium text-[#2f2f2f] shadow-[0_2px_8px_rgba(201,74,137,0.08)] transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_20px_rgba(201,74,137,0.18)]",
                  isActiveLink(pathname, item.href) && "border-[#e478a6] bg-linear-to-r from-[#ffc9dd] to-[#ffbad4] text-[#7c1d4b]",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function CountBadge({ value }: { value: number }) {
  return (
    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef3f7a] px-1 text-[10px] font-semibold text-white">
      {value}
    </span>
  );
}

function IconLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <Link href={href} aria-label={label} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#262626] transition hover:bg-[#e5e5e5]">
      <Icon className="h-6 w-6" />
    </Link>
  );
}
