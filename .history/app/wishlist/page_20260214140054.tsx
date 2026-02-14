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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#f3ced5] bg-gradient-to-r from-[#ffeef2] via-[#ffe6ec] to-[#ffdce5] p-5 sm:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#24438f]">Saved Favorites</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#24438f]">Your Wishlist</h1>
          <p className="mt-1 text-sm text-[#2f3a5e]/80">Save favorites and move them to cart anytime.</p>
        </div>
        {wishlistProducts.length > 0 && (
          <button
            onClick={clear}
            type="button"
            className="rounded-lg border border-[#edd2d9] bg-white px-4 py-2 text-sm font-medium text-[#24438f]"
          >
            Clear wishlist
          </button>
        )}
      </div>

      {wishlistProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e7c7cf] bg-[#fff6f8] p-10 text-center">
          <h2 className="text-lg font-semibold">Wishlist is empty</h2>
          <p className="mt-2 text-sm text-[#2f3a5e]/80">Explore curated products and save what you love.</p>
          <Link href="/store" className="mt-4 inline-flex rounded-lg bg-[#24438f] px-4 py-2 text-sm font-semibold text-white">
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
