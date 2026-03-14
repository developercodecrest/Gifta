"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bike,
  ClipboardList,
  Lock,
  Package,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  UserCog,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
  const links = navItems.map((item) => ({
    ...item,
    hasAccess: canAccess(role, item.key),
  }));

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="offcanvas" className="border-r border-sidebar-border/80">
        <SidebarHeader className="gap-4 p-4">
          <div className="flex items-center gap-3 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/30 p-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.24em] text-sidebar-foreground/65">Gifta Admin</p>
              <p className="truncate text-sm font-semibold text-sidebar-foreground">Marketplace Control</p>
            </div>
          </div>
          <Badge className="w-fit bg-sidebar-primary/15 text-sidebar-primary hover:bg-sidebar-primary/15">{roleLabels[role]}</Badge>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {links.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.href === "/admin" ? pathname === item.href : pathname?.startsWith(item.href);

                  return (
                    <SidebarMenuItem key={item.href}>
                      {item.hasAccess ? (
                        <SidebarMenuButton
                          render={<Link href={item.href} />}
                          isActive={Boolean(isActive)}
                          tooltip={item.label}
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      ) : (
                        <>
                          <SidebarMenuButton disabled className="opacity-70" tooltip={`${item.label} (no access)`}>
                            <Lock />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                          <SidebarMenuBadge>Locked</SidebarMenuBadge>
                        </>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="gap-2 p-3">
          {canAccess(role, "vendors") ? (
            <Button asChild size="sm" className="w-full justify-start">
              <Link href="/admin/vendors/create">New store</Link>
            </Button>
          ) : null}
          {canAccess(role, "items") ? (
            <Button asChild size="sm" variant="outline" className="w-full justify-start">
              <Link href="/admin/items">Open catalog</Link>
            </Button>
          ) : null}
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="h-9 w-9" />
            <p className="text-sm font-medium text-foreground">Marketplace Admin</p>
          </div>
          <Badge variant="secondary">{roleLabels[role]}</Badge>
        </div>

        <div className={cn("space-y-6 px-4 py-5 lg:px-6")}>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
