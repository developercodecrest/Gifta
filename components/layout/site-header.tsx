"use client";

import Link from "next/link";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Gift,
  Heart,
  Moon,
  Sun,
  ShoppingCart,
  Sparkles,
  Tag,
  Truck,
  UserCircle2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/features/cart/store";
import { useWishlistStore } from "@/features/wishlist/store";
import { HeaderSearch } from "@/components/layout/header-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/orders", label: "Orders" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/cart", label: "Cart" },
  { href: "/account", label: "Account" },
];

const featureLinks = [
  { href: "/search?tag=same-day", label: "Same Day" },
  { href: "/search?tag=personalized", label: "Personalized" },
  { href: "/search?category=Birthday", label: "Birthday" },
  { href: "/search?category=Anniversary", label: "Anniversary" },
  { href: "/search?tag=luxury", label: "Premium" },
];

function isActiveLink(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const { status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";
  const cartCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );
  const wishlistCount = useWishlistStore((state) => state.productIds.length);

  return (
    <header className="relative z-40 bg-white/94 text-slate-900 shadow-[0_12px_30px_-26px_rgba(30,20,20,0.18)] backdrop-blur-xl">
      <div className="bg-[linear-gradient(90deg,#fff1e4_0%,#fff7f2_45%,#ffe6d7_100%)]">
        <div className="page-gutter flex items-center justify-between gap-3 py-1.5 text-xs text-slate-700">
          <p className="flex items-center gap-2 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Flat 10% off on first gifting order above ₹999 with code <span className="font-semibold text-slate-900">GIFTA10</span>
          </p>
          <Badge variant="warning" className="hidden border-0 bg-[#1f2937] text-white sm:inline-flex">Festive edits live</Badge>
        </div>
      </div>

      <div className="page-gutter grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 py-1.5 sm:py-2">
        <div className="hidden min-w-0 md:block">
          <HeaderSearch compact />
        </div>

        <div className="flex min-w-0 items-center md:hidden">
          <HeaderSearch mobile />
        </div>

        <div className="flex justify-center">
          <Link href="/" className="inline-flex items-center text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            <span className="rounded-2xl bg-white/80 px-1 py-0.5 shadow-[0_8px_18px_-16px_rgba(44,23,16,0.28)]">
              <Image src="/logo.jpeg" alt="Gifta" width={100} height={100} className="h-11 w-auto object-contain sm:h-12" />
            </span>
          </Link>
        </div>

        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="border-transparent bg-white/90 shadow-[0_10px_20px_-18px_rgba(44,23,16,0.25)] lg:hidden" aria-label="Open menu">
                <Sparkles className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[86%] max-w-xs">
              <SheetHeader>
                <SheetTitle>Browse Gifta</SheetTitle>
                <SheetDescription>Quick access to collections, wishlist and orders.</SheetDescription>
              </SheetHeader>
              <nav className="mt-6 grid gap-2" aria-label="Mobile navigation">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-md border border-border px-3 py-2 text-sm font-medium",
                      isActiveLink(pathname, item.href) ? "bg-secondary text-secondary-foreground" : "hover:bg-accent",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              {status === "authenticated" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => signOut({ callbackUrl: "/auth/sign-in" })}
                >
                  Sign out
                </Button>
              ) : null}
            </SheetContent>
          </Sheet>
          <div className="hidden items-center gap-1.5 lg:flex">
            <Button asChild variant="ghost" size="sm" className="text-slate-700">
              <Link href="/">Home</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-slate-700">
              <Link href="/search">Search</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-slate-700">
              <Link href="/orders">Orders</Link>
            </Button>
          </div>
          <IconLink href="/wishlist" label="Wishlist" icon={Heart} count={wishlistCount} />
          <IconLink href="/cart" label="Cart" icon={ShoppingCart} count={cartCount} />
          {status === "authenticated" ? <IconLink href="/account" label="Account" icon={UserCircle2} /> : null}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden border-transparent bg-white/90 shadow-[0_10px_20px_-18px_rgba(44,23,16,0.25)] sm:inline-flex"
            aria-label="Toggle theme"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {status !== "authenticated" ? (
            <Button asChild variant="outline" size="sm" className="hidden border-transparent bg-white/90 shadow-[0_10px_20px_-18px_rgba(44,23,16,0.25)] sm:inline-flex">
              <Link href="/auth/sign-in">Sign in</Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden border-transparent bg-white/90 shadow-[0_10px_20px_-18px_rgba(44,23,16,0.25)] sm:inline-flex"
              onClick={() => signOut({ callbackUrl: "/auth/sign-in" })}
            >
              Sign out
            </Button>
          )}
        </div>
      </div>

      <div className="page-gutter hidden items-center justify-between gap-4 py-1.5 lg:flex">
        <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700" aria-label="Featured categories">
          {featureLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full px-3 py-1 transition hover:bg-[#fff4ed] hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-5 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-primary" /> Same-day in selected cities</span>
          <span className="flex items-center gap-1.5"><Gift className="h-3.5 w-3.5 text-primary" /> Custom gifting studio</span>
          <span className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-primary" /> Premium festive offers</span>
        </div>
      </div>
    </header>
  );
}

function CountBadge({ value }: { value: number }) {
  return <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center border-0 bg-primary px-1 text-[10px] text-primary-foreground">{value}</Badge>;
}

function IconLink({
  href,
  label,
  icon: Icon,
  count,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  count?: number;
}) {
  return (
    <Link href={href} aria-label={label} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-white/92 text-slate-800 shadow-[0_10px_20px_-18px_rgba(44,23,16,0.25)] transition hover:-translate-y-0.5 hover:bg-[#fff5ef]">
      <Icon className="h-5 w-5" />
      {count && count > 0 ? <CountBadge value={count} /> : null}
    </Link>
  );
}
