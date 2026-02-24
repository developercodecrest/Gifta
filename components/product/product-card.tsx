"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Minus, Plus, ShoppingCart, Star, Store } from "lucide-react";
import { Product } from "@/types/ecommerce";
import { ProductListItemDto } from "@/types/api";
import { formatCurrency } from "@/lib/utils";
import { useWishlistStore } from "@/features/wishlist/store";
import { useCartStore } from "@/features/cart/store";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ProductCardData = Product | ProductListItemDto;

export function ProductCard({ product }: { product: ProductCardData }) {
  const { items, addItem, updateQty } = useCartStore();
  const { productIds, toggle } = useWishlistStore();

  const isLiked = productIds.includes(product.id);
  const price = "bestOffer" in product && product.bestOffer?.price ? product.bestOffer.price : product.price;
  const originalPrice = "bestOffer" in product && product.bestOffer?.originalPrice
    ? product.bestOffer.originalPrice
    : product.originalPrice;
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;
  const minQty = product.minOrderQty ?? 1;
  const maxQty = product.maxOrderQty ?? 10;
  const outOfStock = !product.inStock || maxQty === 0;
  const existing = items.find((item) => item.productId === product.id);
  const currentQty = existing?.quantity ?? 0;

  return (
    <Card className="group overflow-hidden shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/store/${product.slug}`} className="relative block aspect-4/3 w-full overflow-hidden">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {product.featured && <Badge className="text-[10px]">Featured</Badge>}
          {discount > 0 ? <Badge variant="warning" className="text-[10px]">{discount}% OFF</Badge> : null}
        </div>
      </Link>

      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.category}</p>
            <Link href={`/store/${product.slug}`} className="mt-1 block text-base font-semibold leading-snug text-foreground transition hover:text-primary">
              {product.name}
            </Link>
          </div>
          <Button
            type="button"
            onClick={() => toggle(product.id)}
            className={cn(
              "min-h-10 min-w-10 p-2",
              isLiked && "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
            aria-label="Toggle wishlist"
            variant="outline"
            size="icon"
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Star className="h-4 w-4 fill-current text-amber-500" />
          <span>{product.rating}</span>
          <span>({product.reviews})</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{formatCurrency(price)}</span>
          {originalPrice && (
            <span className="text-sm text-muted line-through">{formatCurrency(originalPrice)}</span>
          )}
        </div>

        {"bestOffer" in product && product.bestOffer ? (
          <div className="space-y-1 text-xs text-muted-foreground">
            <p className="flex items-center gap-1"><Store className="h-3.5 w-3.5" /> Best offer by {product.bestOffer.store?.name ?? "Vendor"}</p>
            <p>{product.offerCount} vendor offer{product.offerCount === 1 ? "" : "s"}</p>
          </div>
        ) : null}

        {existing ? (
          <div className="space-y-2">
            <div className="inline-flex min-h-10 w-full items-center justify-between rounded-md border border-border bg-card">
              <Button variant="ghost" size="icon" onClick={() => updateQty(product.id, currentQty - 1, minQty, maxQty)} disabled={currentQty <= minQty}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="px-2 text-sm font-medium">{currentQty}</span>
              <Button variant="ghost" size="icon" onClick={() => updateQty(product.id, currentQty + 1, minQty, maxQty)} disabled={currentQty >= maxQty}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Min {minQty} • Max {maxQty}</p>
          </div>
        ) : (
          <Button
            type="button"
            onClick={() =>
              addItem(
                product.id,
                minQty,
                "bestOffer" in product ? product.bestOffer?.id : undefined,
                minQty,
                maxQty,
              )
            }
            disabled={outOfStock}
            className="w-full"
          >
            <ShoppingCart className="h-4 w-4" />
            {outOfStock ? "Out of stock" : "Add to cart"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
