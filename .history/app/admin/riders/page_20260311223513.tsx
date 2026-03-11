import { Card, CardContent } from "@/components/ui/card";
import { getAdminRiders } from "@/lib/server/ecommerce-service";
import { ensureAdminAccess } from "@/app/admin/_utils";
import { AdminHero, AdminSection } from "@/app/admin/_components/admin-surface";

export default async function AdminRidersPage() {
  await ensureAdminAccess("riders");

  const riders = await getAdminRiders().catch(() => []);
  const active = riders.filter((rider) => rider.status !== "offline").length;
  const onDelivery = riders.filter((rider) => rider.status === "on-delivery").length;
  const liveDeliveries = riders.reduce((total, rider) => total + rider.activeDeliveries, 0);

  return (
    <div className="space-y-6">
      <AdminHero
        eyebrow="Riders"
        title="Last-mile fleet overview"
        description="Monitor zone coverage, active delivery load, and rider availability across the marketplace."
        stats={[
          { label: "Riders", value: String(riders.length), tone: "warm" },
          { label: "Active", value: String(active), tone: "mint" },
          { label: "On delivery", value: String(onDelivery), tone: "sun" },
          { label: "Live deliveries", value: String(liveDeliveries), tone: "warm" },
        ]}
      />

      <AdminSection title="Fleet board" description="Each rider card surfaces zone assignment, current status, and active delivery load.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {riders.map((rider) => (
          <Card key={rider.id} className="border-border/70 bg-background/70">
            <CardContent className="space-y-2 p-3.5">
              <p className="font-semibold">{rider.fullName}</p>
              <p className="text-sm text-muted-foreground">{rider.phone} • Zone {rider.zone}</p>
              <p className="text-xs text-muted-foreground">Status: {rider.status}</p>
              <p className="text-xs text-muted-foreground">Active deliveries: {rider.activeDeliveries}</p>
            </CardContent>
          </Card>
        ))}
        </div>
      </AdminSection>
    </div>
  );
}
