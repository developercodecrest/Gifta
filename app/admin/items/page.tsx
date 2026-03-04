import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { roleLabels } from "@/lib/roles";
import { getAdminItemsScoped } from "@/lib/server/ecommerce-service";
import { ensureAdminAccess } from "@/app/admin/_utils";
import { ItemsClient } from "./items-client";

export default async function AdminItemsPage() {
  const identity = await ensureAdminAccess("items");

  const items = await getAdminItemsScoped(identity).catch(() => ({ items: [] as Array<{ id: string; name: string; category: string; slug: string; minOrderQty?: number; maxOrderQty?: number; bestOffer?: { price: number; store?: { name: string } }; offerCount: number }> }));

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge variant="secondary">Items</Badge>
            <h1 className="mt-2 text-2xl font-bold">Catalog Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">Review product coverage and vendor offer depth. Active role: {roleLabels[identity.role]}.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/items">Items</Link>
          </Button>
        </div>
      </header>

      <ItemsClient items={items.items} />
    </div>
  );
}
