"use client";

import Link from "next/link";
import { Heart, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { products } from "@/data/products";
import { useWishlistStore } from "@/features/wishlist/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function WishlistPage() {
  const ids = useWishlistStore((state) => state.productIds);
  const clear = useWishlistStore((state) => state.clear);
  const wishlistProducts = products.filter((item) => ids.includes(item.id));

  return (
    <div className="space-y-6 py-5 sm:py-6 lg:py-8">
      <header className="surface-mesh soft-shadow rounded-4xl border border-white/70 p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="secondary" className="border-0 bg-white/80 text-slate-800">Saved favorites</Badge>
            <h1 className="font-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">A brighter wishlist with room for the products you care about</h1>
            <p className="mt-3 max-w-2xl text-sm text-[#5f5047] sm:text-base">Keep favorite gifting ideas together, compare them calmly, and move the best picks into cart when you are ready.</p>
          </div>
          {wishlistProducts.length > 0 ? (
            <Button onClick={clear} type="button" variant="outline">
              Clear wishlist
            </Button>
          ) : null}
        </div>
      </header>

      {wishlistProducts.length === 0 ? (
        <Card className="rounded-4xl border-dashed border-[#e5c9bb] bg-white/78 text-slate-950">
          <CardContent className="p-10 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#fff1e6] text-primary">
              <Heart className="h-6 w-6" />
            </span>
            <h2 className="font-display mt-5 text-3xl font-semibold">Wishlist is empty</h2>
            <p className="mt-2 text-sm text-[#5f5047]">Explore the redesigned storefront and save the gifts you want to revisit.</p>
            <Button asChild className="mt-5">
              <Link href="/store">Browse store</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="app-data-panel rounded-4xl px-5 py-4 text-sm text-[#5f5047]">
            {wishlistProducts.length} saved item{wishlistProducts.length === 1 ? "" : "s"} ready for comparison and checkout.
          </section>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {wishlistProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </>
      )}

      <section className="rounded-4xl border border-white/60 bg-[linear-gradient(135deg,#1f1418_0%,#2e1d23_100%)] p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ffc9a6]">Saved for later</p>
            <h2 className="font-display mt-2 text-3xl font-semibold">Use your wishlist as a short list, not a parking lot</h2>
          </div>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#ffc9a6]">
            <Sparkles className="h-5 w-5" />
          </span>
        </div>
      </section>
    </div>
  );
}
