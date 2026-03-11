import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminHero } from "@/app/admin/_components/admin-surface";
import { getAdminItemsScoped, getVendorSummariesScoped } from "@/lib/server/ecommerce-service";
import { ensureAdminAccess } from "@/app/admin/_utils";
import { ItemsClient } from "./items-client";

export default async function AdminItemsPage() {
  const identity = await ensureAdminAccess("items");
  const emptyItems: Awaited<ReturnType<typeof getAdminItemsScoped>> = {
    items: [],
    meta: {
      total: 0,
      totalPages: 1,
      page: 1,
      pageSize: 0,
      filters: {
        sort: "featured",
      },
    },
  };

  const [items, vendors] = await Promise.all([
    getAdminItemsScoped(identity).catch(() => emptyItems),
    getVendorSummariesScoped(identity).catch(() => []),
  ]);

  const activeVendors = vendors.filter((vendor) => vendor.active).length;

  return (
    <div className="space-y-6">
      <AdminHero
        eyebrow="Catalog"
        title="Multi-vendor catalog orchestration"
        description="Create detailed product records, launch them against a specific store, and manage offer pricing, stock, and delivery promise without leaving the admin workspace."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/vendors/categories">Store categories</Link>
          </Button>
        }
        stats={[
          { label: "Catalog items", value: String(items.items.length), tone: "warm" },
          { label: "Active stores", value: String(activeVendors), tone: "mint" },
          { label: "Offer links", value: String(items.items.reduce((total, item) => total + item.offerCount, 0)), tone: "sun" },
          { label: "Featured items", value: String(items.items.filter((item) => item.featured).length), tone: "warm" },
        ]}
      />

      <ItemsClient items={items.items} vendors={vendors} />
    </div>
  );
}
