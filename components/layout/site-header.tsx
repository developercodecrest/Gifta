"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Heart,
  Menu,
  ShoppingCart,
  Sparkles,
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
  { href: "/products", label: "Products" },
  { href: "/orders", label: "Orders" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/cart", label: "Cart" },
  { href: "/account", label: "Account" },
];

const primaryNavItems = navItems.slice(0, 3);

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
    <header className="sticky top-0 z-40 border-b border-[#ead9b4] bg-white/92 text-slate-900 shadow-[0_18px_34px_-28px_rgba(58,41,11,0.22)] backdrop-blur-2xl">
      <div className="bg-[linear-gradient(90deg,#ff0c6f_0%,#e80067_54%,#c30058_100%)]">
        <div className="page-gutter flex flex-wrap items-center justify-between gap-3 py-2 text-[0.72rem] text-white/92 sm:text-xs">
          <p className="flex items-center gap-2 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            Flat 10% off on first gifting order above ₹999 with code <span className="font-semibold text-white">GIFTA10</span>
          </p>
          <Badge variant="warning" className="hidden border-0 bg-white/16 text-white sm:inline-flex">Festive edits live</Badge>
        </div>
      </div>

      <div className="page-gutter py-3 sm:py-4">
        <div className="grid items-center gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-4">
          <div className="flex items-center justify-between gap-3 lg:justify-start">
            <Link href="/" className="inline-flex min-w-0 items-center gap-3 text-slate-900">
              <span className="overflow-hidden rounded-[1.15rem] border border-[#edd8ae] bg-white/92 shadow-[0_12px_24px_-20px_rgba(91,67,18,0.34)]">
                <Image src="/logo.jpeg" alt="Gifta" width={172} height={172} className="h-13 w-auto object-contain sm:h-14" />
              </span>
              <span className="hidden min-w-0 flex-col sm:flex">
                <span className="text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-[#9e7526]">Premium gifting</span>
                <span className="truncate text-lg font-extrabold tracking-[-0.03em] text-slate-900">Gifta</span>
              </span>
            </Link>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-transparent bg-white/95 shadow-[0_12px_22px_-18px_rgba(91,67,18,0.24)] lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
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
                        "rounded-2xl border border-[#ecdab9] px-4 py-3 text-sm font-semibold tracking-[0.01em]",
                        isActiveLink(pathname, item.href)
                          ? "bg-[#fff1d7] text-[#8a601c]"
                          : "bg-white text-slate-700 hover:bg-[#fff7ea]",
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
          </div>

          <div className="hidden min-w-0 lg:block">
            <HeaderSearch compact />
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-2.5">
            <div className="hidden items-center gap-1 rounded-full border border-[#f0e1c7] bg-white/72 p-1 xl:flex">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold tracking-[0.01em] text-slate-700 transition hover:bg-[#fff2de] hover:text-[#8b601d]",
                    isActiveLink(pathname, item.href) && "bg-[#fff2de] text-[#8b601d]",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <IconLink href="/wishlist" label="Wishlist" icon={Heart} count={wishlistCount} />
            <IconLink href="/cart" label="Cart" icon={ShoppingCart} count={cartCount} />
            {status === "authenticated" ? <IconLink href="/account" label="Account" icon={UserCircle2} /> : null}
            {status === "unauthenticated" ? (
              <Button asChild size="sm" className="hidden px-4 sm:inline-flex">
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
            ) : null}
            {status === "authenticated" ? (
              <Button
                type="button"
                size="sm"
                className="hidden px-4 sm:inline-flex"
                onClick={() => signOut({ callbackUrl: "/auth/sign-in" })}
              >
                Sign out
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-3 lg:hidden">
          <HeaderSearch mobile />
        </div>

        <div className="mt-3 hidden items-center gap-2 border-t border-[#f0e1c7]/70 pt-3 lg:flex xl:hidden">
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold tracking-[0.01em] text-slate-700 transition hover:bg-[#fff2de] hover:text-[#8b601d]",
                isActiveLink(pathname, item.href) && "bg-[#fff2de] text-[#8b601d]",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}

function CountBadge({ value }: { value: number }) {
  return <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center border-0 bg-[color:var(--brand-gold)] px-1 text-[10px] text-white">{value}</Badge>;
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
    <Link href={href} aria-label={label} className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#eee1ca] bg-white/96 text-slate-800 shadow-[0_12px_24px_-18px_rgba(44,23,16,0.28)] transition hover:-translate-y-0.5 hover:bg-[#fff6e6] hover:text-[#8b601d]">
      <Icon className="h-5 w-5" />
      {count && count > 0 ? <CountBadge value={count} /> : null}
    </Link>
  );
}
