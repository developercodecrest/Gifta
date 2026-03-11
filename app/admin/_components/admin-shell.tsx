"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck, Store, Package, Users, ClipboardList, UserCog, Settings, Bike, Sparkles, ChevronRight } from "lucide-react";
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
import { Role } from "@/types/api";
import { roleLabels, canAccess } from "@/lib/roles";
import { cn } from "@/lib/utils";

const navItems = [
  { key: "dashboard", href: "/admin", label: "Dashboard", icon: ShieldCheck },
  { key: "vendors", href: "/admin/vendors", label: "Vendors", icon: Store },
  { key: "items", href: "/admin/items", label: "Items", icon: Package },
  { key: "orders", href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { key: "riders", href: "/admin/riders", label: "Riders", icon: Bike },
  { key: "users", href: "/admin/users", label: "Users", icon: Users },
  { key: "roles", href: "/admin/roles", label: "Roles", icon: UserCog },
  { key: "settings", href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminShell({ children, role }: { children: React.ReactNode; role: Role }) {
  const pathname = usePathname();
  const links = navItems.filter((item) => canAccess(role, item.key));

  const renderNav = (compact = false) => (
    <nav className={cn("flex flex-col gap-2", compact && "mt-4")}> 
      {links.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === "/admin" ? pathname === item.href : pathname?.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center justify-between rounded-[1.15rem] border px-3.5 py-3 text-sm transition-all duration-200",
              isActive
                ? "border-transparent bg-foreground text-background shadow-[0_18px_38px_-28px_rgba(32,22,31,0.55)]"
                : "border-border/70 bg-background/70 text-foreground hover:border-primary/35 hover:bg-card",
            )}
          >
            <span className="flex items-center gap-3">
              <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-full", isActive ? "bg-background/15" : "bg-primary/10 text-primary")}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="font-medium">{item.label}</span>
            </span>
            <ChevronRight className={cn("h-4 w-4 transition-transform group-hover:translate-x-0.5", isActive ? "text-background/75" : "text-muted-foreground")} />
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <div className="sticky top-6 overflow-hidden rounded-4xl border border-border/70 bg-card/85 p-5 shadow-[0_28px_80px_-56px_rgba(116,60,39,0.45)] backdrop-blur-md">
          <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(255,95,109,0.18),transparent_70%)]" />
          <div className="relative space-y-5">
            <div className="space-y-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Gifta Command</p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.05em] text-foreground">Marketplace Admin</h2>
              </div>
              <Badge className="bg-primary/12 text-primary hover:bg-primary/12">{roleLabels[role]}</Badge>
            </div>

            <div className="rounded-[1.35rem] border border-border/70 bg-background/75 p-4">
              <p className="text-sm font-medium text-foreground">Operations focus</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Vendor onboarding, catalog quality, delivery health, and role-governed control in one place.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {canAccess(role, "vendors") ? (
                <Button asChild size="sm">
                  <Link href="/admin/vendors/create">New store</Link>
                </Button>
              ) : null}
              {canAccess(role, "items") ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/items">Catalog</Link>
                </Button>
              ) : null}
            </div>

            {renderNav()}
          </div>
        </div>
      </aside>

      <div className="min-w-0 space-y-6">
        <div className="flex items-center justify-between rounded-[1.4rem] border border-border/60 bg-card/80 px-4 py-3 shadow-[0_18px_50px_-42px_rgba(116,60,39,0.35)] backdrop-blur lg:hidden">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Gifta Admin</p>
            <p className="mt-1 font-semibold text-foreground">{roleLabels[role]}</p>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-background/98">
              <SheetHeader>
                <SheetTitle>Marketplace Admin</SheetTitle>
                <SheetDescription>Navigate the control surfaces available for your current role.</SheetDescription>
              </SheetHeader>
              {renderNav(true)}
            </SheetContent>
          </Sheet>
        </div>

        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
