"use client";

import Link from "next/link";
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div>
          <Badge variant="secondary">Saved favorites</Badge>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Your wishlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">Save favorites and move them to cart anytime.</p>
        </div>
        {wishlistProducts.length > 0 && (
          <Button
            onClick={clear}
            type="button"
            variant="outline"
          >
            Clear wishlist
          </Button>
        )}
      </div>

      {wishlistProducts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center">
            <h2 className="text-lg font-semibold">Wishlist is empty</h2>
            <p className="mt-2 text-sm text-muted-foreground">Explore curated products and save what you love.</p>
            <Button asChild className="mt-4">
              <Link href="/store">Browse store</Link>
            </Button>
          </CardContent>
        </Card>
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
