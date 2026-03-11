import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getVendorSummariesScoped } from "@/lib/server/ecommerce-service";
import { ensureAdminAccess } from "@/app/admin/_utils";
import { AdminHero, AdminSection } from "@/app/admin/_components/admin-surface";
import { VendorsClient } from "./vendors-client";

export default async function AdminVendorsPage() {
  const identity = await ensureAdminAccess("vendors");

  const vendors = await getVendorSummariesScoped(identity).catch(() => []);
  const totalItems = vendors.reduce((total, vendor) => total + vendor.itemCount, 0);
  const totalOffers = vendors.reduce((total, vendor) => total + vendor.offerCount, 0);

  return (
    <div className="space-y-6">
      <AdminHero
        eyebrow="Vendors"
        title="Seller network and storefront operations"
        description="Oversee seller quality, category mapping, and assortment scale across each storefront."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/vendors/categories">Manage categories</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/vendors/create">Create store</Link>
            </Button>
          </>
        }
        stats={[
          { label: "Stores", value: String(vendors.length), tone: "warm" },
          { label: "Active", value: String(vendors.filter((vendor) => vendor.active).length), tone: "mint" },
          { label: "Catalog items", value: String(totalItems), tone: "sun" },
          { label: "Offer links", value: String(totalOffers), tone: "warm" },
        ]}
      />

      <AdminSection title="Vendor directory" description="Browse every store in scope, then edit status, categories, and storefront metadata.">
        <VendorsClient vendors={vendors} />
      </AdminSection>
    </div>
  );
}
