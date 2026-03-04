import { Badge } from "@/components/ui/badge";
import { roleLabels } from "@/lib/roles";
import { getVendorSummariesScoped } from "@/lib/server/ecommerce-service";
import { ensureAdminAccess } from "@/app/admin/_utils";
import { StoreCategoriesManager } from "./store-categories-manager";

export default async function AdminVendorCategoriesPage() {
  const identity = await ensureAdminAccess("vendors");
  const vendors = await getVendorSummariesScoped(identity).catch(() => []);

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-border bg-card p-5">
        <Badge variant="secondary">Vendors / Categories</Badge>
        <h1 className="mt-2 text-2xl font-bold">Store Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Each store can maintain its own categories and subcategories. Active role: {roleLabels[identity.role]}.
        </p>
      </header>

      <StoreCategoriesManager vendors={vendors} />
    </div>
  );
}
