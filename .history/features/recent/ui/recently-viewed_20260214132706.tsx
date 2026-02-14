"use client";

import { ProductCard } from "@/components/product/product-card";
import { products } from "@/data/products";
import { useRecentStore } from "@/features/recent/store";

export function RecentlyViewed({ currentId }: { currentId: string }) {
  const ids = useRecentStore((state) => state.productIds);
  const list = ids
    .filter((id) => id !== currentId)
    .map((id) => products.find((item) => item.id === id))
    .filter(Boolean)
    .slice(0, 4);

  if (!list.length) return null;

  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">Recently viewed</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </section>
  );
}
