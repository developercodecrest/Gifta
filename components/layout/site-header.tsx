"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Gift,
  Heart,
  Moon,
  Sun,
  ShoppingCart,
  Sparkles,
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
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/orders", label: "Orders" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/cart", label: "Cart" },
  { href: "/account", label: "Account" },
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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="border-b border-border/60 bg-secondary/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs sm:px-6 lg:px-8">
          <p className="text-muted-foreground">Extra ₹250 OFF on first order above ₹999 with code <span className="font-semibold text-foreground">NEWHABIT250</span></p>
          <Badge variant="warning" className="hidden sm:inline-flex">Flash Deals Live</Badge>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                <Sparkles className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[86%] max-w-xs">
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
            </SheetContent>
          </Sheet>

          <Link href="/" className="inline-flex items-center gap-2 text-xl font-black tracking-tight text-primary sm:text-2xl">
            <Gift className="h-5 w-5" /> GIFTA
          </Link>
        </div>

        <div className="hidden lg:block lg:flex-1">
          <HeaderSearch />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <IconLink href="/wishlist" label="Wishlist" icon={Heart} count={wishlistCount} />
          <IconLink href="/cart" label="Cart" icon={ShoppingCart} count={cartCount} />
          {status === "authenticated" ? <IconLink href="/account" label="Account" icon={UserCircle2} /> : null}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden sm:inline-flex"
            aria-label="Toggle theme"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {status !== "authenticated" ? (
            <Button asChild variant="outline" size="sm" className="inline-flex">
              <Link href="/auth/sign-in">Sign in</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border/60 px-4 py-3 lg:hidden sm:px-6">
        <HeaderSearch mobile />
      </div>
      <Separator />
    </header>
  );
}

function CountBadge({ value }: { value: number }) {
  return <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center px-1 text-[10px]">{value}</Badge>;
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
    <Link href={href} aria-label={label} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:bg-accent">
      <Icon className="h-6 w-6" />
      {count && count > 0 ? <CountBadge value={count} /> : null}
    </Link>
  );
}
