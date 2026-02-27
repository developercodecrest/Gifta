import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { roleLabels } from "@/lib/roles";
import { getAdminRiders } from "@/lib/server/ecommerce-service";
import { ensureAdminAccess } from "@/app/admin/_utils";

export default async function AdminRidersPage() {
  const identity = await ensureAdminAccess("riders");

  const riders = await getAdminRiders().catch(() => []);

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-border bg-card p-5">
        <Badge variant="secondary">Riders</Badge>
        <h1 className="mt-2 text-2xl font-bold">Delivery Fleet</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor last-mile partners and delivery load. Active role: {roleLabels[identity.role]}.</p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {riders.map((rider) => (
          <Card key={rider.id}>
            <CardContent className="space-y-2 p-4">
              <p className="font-semibold">{rider.fullName}</p>
              <p className="text-sm text-muted-foreground">{rider.phone} • Zone {rider.zone}</p>
              <p className="text-xs text-muted-foreground">Status: {rider.status}</p>
              <p className="text-xs text-muted-foreground">Active deliveries: {rider.activeDeliveries}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
