"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/features/cart/store";
import { useWishlistStore } from "@/features/wishlist/store";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/store", label: "Store" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/cart", label: "Cart" },
  { href: "/auth/sign-in", label: "Sign In" },
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

  const isStorePage = useMemo(() => pathname.startsWith("/store"), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="bg-primary px-4 py-2 text-center text-xs font-medium text-primary-foreground sm:text-sm">
        Free shipping on orders above ₹1999 · Premium gift wrapping included
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="min-h-11 min-w-11 rounded-md border border-border p-2 md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <Link href="/" className="text-2xl font-bold tracking-tight text-primary">
            Gifta
          </Link>
          <span className="hidden rounded-full bg-surface px-2 py-1 text-[11px] font-semibold text-muted sm:inline-flex">
            Premium Gifts
          </span>
        </div>

        <nav className="hidden items-center gap-2 rounded-full border border-border bg-white p-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-surface hover:text-foreground",
                isActiveLink(pathname, item.href) && "bg-surface text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isStorePage && (
            <Link href="/store" className="hidden min-h-11 min-w-11 rounded-md border border-border p-2 transition hover:bg-surface sm:inline-flex">
              <Search className="h-4 w-4" />
            </Link>
          )}
          <Link href="/wishlist" className="relative min-h-11 min-w-11 rounded-md border border-border p-2 transition hover:bg-surface">
            <Heart className="h-4 w-4" />
            {wishlistCount > 0 && <CountBadge value={wishlistCount} />}
          </Link>
          <Link href="/cart" className="relative min-h-11 min-w-11 rounded-md border border-border p-2 transition hover:bg-surface">
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && <CountBadge value={cartCount} />}
          </Link>
          <Link
            href="/auth/sign-in"
            className="hidden rounded-md border border-border bg-white px-3 py-2 text-sm font-medium transition hover:bg-surface md:inline-flex"
          >
            Sign in
          </Link>
        </div>
      </div>

      {open && (
        <nav className="space-y-2 border-t border-border px-4 py-4 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block min-h-11 rounded-md px-3 py-2.5 text-sm transition",
                isActiveLink(pathname, item.href) ? "bg-surface text-foreground" : "text-muted hover:bg-surface",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

function CountBadge({ value }: { value: number }) {
  return (
    <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
      {value}
    </span>
  );
}
