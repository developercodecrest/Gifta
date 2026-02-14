"use client";

import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { products } from "@/data/products";
import { useWishlistStore } from "@/features/wishlist/store";

export default function WishlistPage() {
  const ids = useWishlistStore((state) => state.productIds);
  const clear = useWishlistStore((state) => state.clear);
  const wishlistProducts = products.filter((item) => ids.includes(item.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Wishlist</h1>
          <p className="text-sm text-muted">Save favorites and move them to cart anytime.</p>
        </div>
        {wishlistProducts.length > 0 && (
          <button
            onClick={clear}
            type="button"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
          >
            Clear wishlist
          </button>
        )}
      </div>

      {wishlistProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center">
          <h2 className="text-lg font-semibold">Wishlist is empty</h2>
          <p className="mt-2 text-sm text-muted">Explore curated products and save what you love.</p>
          <Link href="/store" className="mt-4 inline-flex rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background">
            Browse store
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {wishlistProducts.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      )}
    </div>
  );
}
