import Link from "next/link";
import { ShieldCheck, Store, Package, Users, ClipboardList, UserCog, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Role } from "@/types/api";
import { roleLabels, canAccess } from "@/lib/roles";

const navItems = [
  { key: "dashboard", href: "/admin", label: "Dashboard", icon: ShieldCheck },
  { key: "vendors", href: "/admin/vendors", label: "Vendors", icon: Store },
  { key: "items", href: "/admin/items", label: "Items", icon: Package },
  { key: "orders", href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { key: "users", href: "/admin/users", label: "Users", icon: Users },
  { key: "roles", href: "/admin/roles", label: "Roles", icon: UserCog },
  { key: "settings", href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminShell({ children, role }: { children: React.ReactNode; role: Role }) {

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Admin role</p>
            <Badge className="mt-2">{roleLabels[role]}</Badge>
          </div>
        </div>

        <nav className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {navItems.map((item) => {
            if (!canAccess(role, item.key)) {
              return null;
            }

            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <Icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="space-y-6">{children}</div>
    </div>
  );
}
