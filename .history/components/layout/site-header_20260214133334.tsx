"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/features/cart/store";
import { useWishlistStore } from "@/features/wishlist/store";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/store", label: "Store" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/cart", label: "Cart" },
  { href: "/checkout", label: "Checkout" },
  { href: "/account", label: "Account" },
  { href: "/auth/sign-in", label: "Sign In" },
];

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
      <div className="bg-primary py-2 text-center text-sm font-medium text-primary-foreground">
        Free shipping on orders above ₹1999 · Premium gift wrapping included
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-md border border-border p-2 md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <Link href="/" className="text-2xl font-bold tracking-tight text-primary">
            Gifta
          </Link>
        </div>

        <nav className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium text-muted transition hover:text-foreground",
                pathname === item.href && "text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isStorePage && (
            <Link href="/store" className="hidden rounded-md border border-border p-2 sm:inline-flex">
              <Search className="h-4 w-4" />
            </Link>
          )}
          <Link href="/wishlist" className="relative rounded-md border border-border p-2">
            <Heart className="h-4 w-4" />
            {wishlistCount > 0 && <CountBadge value={wishlistCount} />}
          </Link>
          <Link href="/cart" className="relative rounded-md border border-border p-2">
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && <CountBadge value={cartCount} />}
          </Link>
          <Link href="/account" className="rounded-md border border-border p-2">
            <User className="h-4 w-4" />
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
                "block rounded-md px-3 py-2 text-sm",
                pathname === item.href ? "bg-surface text-foreground" : "text-muted",
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
