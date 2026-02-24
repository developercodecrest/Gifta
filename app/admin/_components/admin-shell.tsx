import Link from "next/link";
import { ShieldCheck, Store, Package, Truck, Users, ClipboardList, UserCog, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Role } from "@/types/api";
import { roleLabels, canAccess } from "@/lib/roles";

const navItems = [
  { key: "dashboard", href: "/admin", label: "Dashboard", icon: ShieldCheck },
  { key: "vendors", href: "/admin/vendors", label: "Vendors", icon: Store },
  { key: "items", href: "/admin/items", label: "Items", icon: Package },
  { key: "orders", href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { key: "users", href: "/admin/users", label: "Users", icon: Users },
  { key: "riders", href: "/admin/riders", label: "Riders", icon: Truck },
  { key: "roles", href: "/admin/roles", label: "Roles", icon: UserCog },
  { key: "settings", href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminShell({ children, role }: { children: React.ReactNode; role: Role }) {

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-4 rounded-xl border border-border bg-card p-4 h-fit lg:sticky lg:top-24">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Admin role</p>
          <Badge className="mt-2">{roleLabels[role]}</Badge>
        </div>

        <nav className="grid gap-1">
          {navItems.map((item) => {
            if (!canAccess(role, item.key)) {
              return null;
            }

            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
                <Icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="space-y-6">{children}</div>
    </div>
  );
}
