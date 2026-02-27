import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { roleLabels } from "@/lib/roles";
import { getAdminItemsScoped } from "@/lib/server/ecommerce-service";
import { ensureAdminAccess } from "@/app/admin/_utils";
import { QuantityEditor } from "./quantity-editor";

export default async function AdminItemsPage() {
  const identity = await ensureAdminAccess("items");

  const items = await getAdminItemsScoped(identity).catch(() => ({ items: [] as Array<{ id: string; name: string; category: string; slug: string; minOrderQty?: number; maxOrderQty?: number; bestOffer?: { price: number; store?: { name: string } }; offerCount: number }> }));

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-border bg-card p-5">
        <Badge variant="secondary">Items</Badge>
        <h1 className="mt-2 text-2xl font-bold">Catalog Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review product coverage and vendor offer depth. Active role: {roleLabels[identity.role]}.</p>
      </header>

      <div className="grid gap-4">
        {items.items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.category} • {item.offerCount} offers</p>
                <p className="text-xs text-muted-foreground">Best vendor: {item.bestOffer?.store?.name ?? "N/A"}</p>
                <div className="mt-2">
                  <p className="mb-1 text-xs text-muted-foreground">Min/Max quantity</p>
                  <QuantityEditor itemId={item.id} minOrderQty={item.minOrderQty} maxOrderQty={item.maxOrderQty} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">₹{item.bestOffer?.price ?? "--"}</p>
                <Button asChild size="sm" variant="outline"><Link href={`/store/${item.slug}`}>Open</Link></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
