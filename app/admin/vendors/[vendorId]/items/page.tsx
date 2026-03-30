import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHero, AdminSection } from "@/app/admin/_components/admin-surface";
import { ensureAdminAccess } from "@/app/admin/_utils";
import { getAdminItemsScoped, getGlobalCategoryOptions, getVendorSummariesScoped } from "@/lib/server/ecommerce-service";
import { ItemsClient } from "@/app/admin/items/items-client";

export default async function AdminVendorItemsPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const identity = await ensureAdminAccess("vendors");
  const { vendorId } = await params;

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

  const [allItems, vendors, globalCategories] = await Promise.all([
    getAdminItemsScoped(identity).catch(() => emptyItems),
    getVendorSummariesScoped(identity).catch(() => []),
    getGlobalCategoryOptions().catch(() => []),
  ]);

  const vendor = vendors.find((entry) => entry.id === vendorId);
  if (!vendor) {
    notFound();
  }

  const items = allItems.items
    .filter((item) => (item.offers ?? []).some((offer) => offer.storeId === vendorId))
    .map((item) => {
      const scopedOffers = (item.offers ?? []).filter((offer) => offer.storeId === vendorId);
      return {
        ...item,
        offers: scopedOffers,
        bestOffer: scopedOffers[0],
        offerCount: scopedOffers.length,
      };
    });

  const totalOffers = items.reduce((total, item) => total + item.offerCount, 0);

  return (
    <div className="space-y-6">
      <AdminHero
        eyebrow="Vendor items"
        title={`${vendor.name} catalog workspace`}
        description="Create and manage items mapped to this vendor only. Category validation accepts the merged global taxonomy and this vendor's categories."
        actions={
          <>
            <Link href="/admin/vendors" className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-[#cd9933] bg-[#cd9933] px-2.5 py-1.5 text-sm font-medium text-white hover:bg-[#b8872d]">
              Back to vendors
            </Link>
            <Link href="/admin/vendors/categories" className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-[#cd9933] bg-[#cd9933] px-2.5 py-1.5 text-sm font-medium text-white hover:bg-[#b8872d]">
              Manage categories
            </Link>
          </>
        }
        stats={[
          { label: "Vendor items", value: String(items.length), tone: "warm" },
          { label: "Vendor offers", value: String(totalOffers), tone: "mint" },
          { label: "Mapped categories", value: String(vendor.categoryBreakdown?.length ?? 0), tone: "sun" },
          { label: "Store status", value: vendor.active ? "active" : "inactive", tone: "warm" },
        ]}
      />

      <AdminSection title="Category aggregation" description="Category totals are computed from this vendor's item-offer mappings.">
        <div className="flex flex-wrap gap-2">
          {(vendor.categoryBreakdown ?? []).length ? (
            vendor.categoryBreakdown!.map((entry) => (
              <span key={`${vendor.id}-${entry.category}`} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground">
                {entry.category}: {entry.itemCount} items / {entry.offerCount} offers
              </span>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No category aggregates yet for this vendor.</p>
          )}
        </div>
      </AdminSection>

      <ItemsClient items={items} vendors={[vendor]} globalCategories={globalCategories} lockedStoreId={vendor.id} />
    </div>
  );
}
