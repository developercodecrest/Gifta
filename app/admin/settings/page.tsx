import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { roleLabels } from "@/lib/roles";
import { ensureAdminAccess } from "@/app/admin/_utils";

export default async function AdminSettingsPage() {
  const role = await ensureAdminAccess("settings");

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-border bg-card p-5">
        <Badge variant="secondary">Settings</Badge>
        <h1 className="mt-2 text-2xl font-bold">Marketplace Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure commission, payout cycle, SLA and platform-level defaults. Active role: {roleLabels[role]}.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="font-semibold">Commission</p>
            <p className="text-sm text-muted-foreground">Default platform commission: 12% per order.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="font-semibold">Payout Cycle</p>
            <p className="text-sm text-muted-foreground">Vendor settlements every 7 days.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="font-semibold">Delivery SLA</p>
            <p className="text-sm text-muted-foreground">Standard SLA: 24-48 hours in serviceable zones.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="font-semibold">Role Policy</p>
            <p className="text-sm text-muted-foreground">Only sadmin can manage roles and platform-level controls.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
