import { getVendorSummariesScoped } from "@/lib/server/ecommerce-service";
import { ensureAdminAccess } from "@/app/admin/_utils";
import { AdminHero, AdminSection } from "@/app/admin/_components/admin-surface";
import { StoreCategoriesManager } from "./store-categories-manager";

export default async function AdminVendorCategoriesPage() {
  const identity = await ensureAdminAccess("vendors");
  const vendors = await getVendorSummariesScoped(identity).catch(() => []);

  return (
    <div className="space-y-6">
      <AdminHero
        eyebrow="Vendor taxonomy"
        title="Store-specific category architecture"
        description="Give each seller its own category and subcategory map so catalog creation stays aligned with the storefront actually selling the item."
        stats={[
          { label: "Stores", value: String(vendors.length), tone: "warm" },
          { label: "Scoped role", value: identity.role, tone: "mint" },
        ]}
      />

      <AdminSection title="Category manager" description="Maintain vendor-specific category trees and keep item creation aligned to the right storefront structure.">
        <StoreCategoriesManager vendors={vendors} />
      </AdminSection>
    </div>
  );
}
