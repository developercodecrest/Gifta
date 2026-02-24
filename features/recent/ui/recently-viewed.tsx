"use client";

import { ProductCard } from "@/components/product/product-card";
import { products } from "@/data/products";
import { useRecentStore } from "@/features/recent/store";
import { Separator } from "@/components/ui/separator";

export function RecentlyViewed({ currentId }: { currentId: string }) {
  const ids = useRecentStore((state) => state.productIds);
  const list = ids
    .filter((id) => id !== currentId)
    .flatMap((id) => {
      const found = products.find((item) => item.id === id);
      return found ? [found] : [];
    })
    .slice(0, 4);

  if (!list.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold tracking-tight">Recently viewed</h2>
        <Separator className="flex-1" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </section>
  );
}
