"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Gift,
  Heart,
  ShoppingCart,
  Sparkles,
  Tag,
  Truck,
  UserCircle2,
} from "lucide-react";
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
  const cartCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );
  const wishlistCount = useWishlistStore((state) => state.productIds.length);

  return (
    <header className="relative z-40 border-b border-[#ead9b4] bg-white/94 text-slate-900 shadow-[0_12px_30px_-26px_rgba(58,41,11,0.18)] backdrop-blur-xl">
      <div className="bg-[#ff0066]">
        <div className="page-gutter flex items-center justify-between gap-3 py-1.5 text-xs text-white/90">
          <p className="flex items-center gap-2 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            Flat 10% off on first gifting order above ₹999 with code <span className="font-semibold text-white">GIFTA10</span>
          </p>
          <Badge variant="warning" className="hidden border-0 bg-white/16 text-white sm:inline-flex">Festive edits live</Badge>
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
            <Image src="/logo.jpeg" alt="Gifta" width={172} height={172} className="h-14 w-auto object-contain sm:h-16" />
          </Link>
        </div>

        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="border-transparent bg-white/92 shadow-[0_10px_20px_-18px_rgba(91,67,18,0.2)] lg:hidden" aria-label="Open menu">
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
          {status !== "authenticated" ? (
            <Button asChild size="sm" className="hidden text-white [&_a]:text-white sm:inline-flex">
              <Link href="/auth/sign-in">Sign in</Link>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="hidden text-white sm:inline-flex"
              onClick={() => signOut({ callbackUrl: "/auth/sign-in" })}
            >
              Sign out
            </Button>
          )}
        </div>
      </div>

      {pathname !== "/" ? (
        <div className="page-gutter hidden items-center justify-between gap-4 py-1.5 lg:flex">
          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700" aria-label="Featured categories">
            {featureLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-full px-3 py-1 transition hover:bg-[#fbf0d6] hover:text-slate-900"
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
      ) : null}
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
