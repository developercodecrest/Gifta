"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bike,
  ClipboardList,
  FolderTree,
  Lock,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  UserCog,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
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
  { key: "vendors", href: "/admin/vendors/categories", label: "Categories", icon: FolderTree, nested: true },
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
      <Sidebar
        variant="sidebar"
        collapsible="offcanvas"
        className="border-r border-slate-200 **:data-[sidebar=sidebar]:bg-white **:data-[sidebar=sidebar]:text-slate-900"
      >
        <SidebarHeader className="gap-4 p-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#cd9933] text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Gifta Admin</p>
              <p className="truncate text-sm font-semibold text-slate-900">Control Center</p>
            </div>
          </div>
          <Badge className="w-fit bg-[#cd9933]/15 text-[#9e7526] hover:bg-[#cd9933]/15">{roleLabels[role]}</Badge>
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
                          className={cn(
                            "text-slate-800 data-active:bg-[#cd9933] data-active:text-white hover:bg-[#f8f1e1]",
                            item.nested ? "pl-8 text-sm" : undefined,
                          )}
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      ) : (
                        <>
                          <SidebarMenuButton disabled className="opacity-70 text-slate-500" tooltip={`${item.label} (no access)`}>
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
      </Sidebar>

      <SidebarInset className="min-w-0">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="h-9 w-9" />
            <p className="text-sm font-semibold text-slate-900">Admin Workspace</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Secure Mode</span>
            <Badge className="bg-[#cd9933] text-white hover:bg-[#cd9933]">{roleLabels[role]}</Badge>
          </div>
        </div>

        <div className={cn("space-y-6 px-4 py-5 lg:px-6")}>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
