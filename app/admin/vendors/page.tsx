import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { roleLabels } from "@/lib/roles";
import { getVendorSummaries } from "@/lib/server/ecommerce-service";
import { ensureAdminAccess } from "@/app/admin/_utils";

export default async function AdminVendorsPage() {
  const role = await ensureAdminAccess("vendors");

  const vendors = await getVendorSummaries().catch(() => []);

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-border bg-card p-5">
        <Badge variant="secondary">Vendors</Badge>
        <h1 className="mt-2 text-2xl font-bold">Vendor Directory</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage all sellers in the marketplace. Active role: {roleLabels[role]}.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {vendors.map((vendor) => (
          <Card key={vendor.id}>
            <CardContent className="space-y-2 p-5">
              <p className="font-semibold">{vendor.name}</p>
              <p className="text-sm text-muted-foreground">Rating {vendor.rating.toFixed(1)} • {vendor.active ? "Active" : "Inactive"}</p>
              <p className="text-sm text-muted-foreground">Items: {vendor.itemCount} • Offers: {vendor.offerCount}</p>
              <p className="text-xs text-muted-foreground">Owner ID: {vendor.ownerUserId ?? "N/A"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
