"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Product } from "@/types/ecommerce";
import { formatCurrency } from "@/lib/utils";
import { useWishlistStore } from "@/features/wishlist/store";
import { useCartStore } from "@/features/cart/store";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartStore();
  const { productIds, toggle } = useWishlistStore();

  const isLiked = productIds.includes(product.id);

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/store/${product.slug}`} className="relative block aspect-[4/3] w-full overflow-hidden">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </Link>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{product.category}</p>
            <Link href={`/store/${product.slug}`} className="mt-1 block text-base font-semibold leading-snug transition hover:text-primary">
              {product.name}
            </Link>
          </div>
          <button
            type="button"
            onClick={() => toggle(product.id)}
            className={cn(
              "min-h-10 min-w-10 rounded-md border border-border p-2",
              isLiked && "bg-primary text-primary-foreground",
            )}
            aria-label="Toggle wishlist"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted">
          <Star className="h-4 w-4 fill-current text-amber-500" />
          <span>{product.rating}</span>
          <span>({product.reviews})</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{formatCurrency(product.price)}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted line-through">{formatCurrency(product.originalPrice)}</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => addItem(product.id, 1)}
          disabled={!product.inStock}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart className="h-4 w-4" />
          {product.inStock ? "Add to cart" : "Out of stock"}
        </button>
      </div>
    </article>
  );
}
