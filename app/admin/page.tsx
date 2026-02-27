import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { roleLabels } from "@/lib/roles";
import { getAdminDashboardScoped } from "@/lib/server/ecommerce-service";
import { ensureAdminAccess } from "@/app/admin/_utils";

export default async function AdminDashboardPage() {
  const identity = await ensureAdminAccess("dashboard");

  const data = await getAdminDashboardScoped(identity).catch(() => ({
    totalVendors: 0,
    activeVendors: 0,
    totalItems: 0,
    totalOffers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRiders: 0,
    activeRiders: 0,
    totalUsers: 0,
  }));

  const metrics = [
    ["Total Vendors", data.totalVendors],
    ["Active Vendors", data.activeVendors],
    ["Marketplace Items", data.totalItems],
    ["Live Offers", data.totalOffers],
    ["Orders", data.totalOrders],
    ["Pending Orders", data.pendingOrders],
    ["Riders", data.totalRiders],
    ["Users", data.totalUsers],
  ] as const;

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-border bg-card p-5">
        <Badge>Admin</Badge>
        <h1 className="mt-2 text-2xl font-bold">Marketplace Control Tower</h1>
        <p className="mt-1 text-sm text-muted-foreground">Viewing as {roleLabels[identity.role]}. Monitor vendor operations, logistics and user activity.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
