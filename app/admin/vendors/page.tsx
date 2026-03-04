import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { roleLabels } from "@/lib/roles";
import { getVendorSummariesScoped } from "@/lib/server/ecommerce-service";
import { ensureAdminAccess } from "@/app/admin/_utils";
import { VendorsClient } from "./vendors-client";

export default async function AdminVendorsPage() {
  const identity = await ensureAdminAccess("vendors");

  const vendors = await getVendorSummariesScoped(identity).catch(() => []);

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge variant="secondary">Vendors</Badge>
            <h1 className="mt-2 text-2xl font-bold">Vendor Directory</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage all sellers in the marketplace. Active role: {roleLabels[identity.role]}.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/vendors/categories">Create categories</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/vendors/create">Create store</Link>
            </Button>
          </div>
        </div>
      </header>

      <div>
        <VendorsClient vendors={vendors} />
      </div>
    </div>
  );
}
