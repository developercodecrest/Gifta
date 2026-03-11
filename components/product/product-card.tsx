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
    <Card className="group glass-panel overflow-hidden rounded-[1.75rem] border-white/60 shadow-[0_24px_60px_-40px_rgba(67,34,29,0.45)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_-40px_rgba(67,34,29,0.58)]">
      <Link href={`/store/${product.slug}`} className="relative block aspect-square w-full overflow-hidden bg-[#f8ede5]">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover transition duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/30 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1">
          {product.featured && <Badge className="text-[10px]">Featured</Badge>}
          {discount > 0 ? <Badge variant="warning" className="border-0 bg-white/90 text-[10px] text-[#7b3d15]">{discount}% OFF</Badge> : null}
        </div>
        <div className="absolute bottom-3 left-3 rounded-full bg-white/88 px-3 py-1 text-[11px] font-semibold text-slate-800 backdrop-blur">
          {product.category}
        </div>
      </Link>

      <CardContent className="space-y-3 p-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-current text-amber-500" />
              <span className="font-medium text-foreground">{product.rating}</span>
              <span>({product.reviews})</span>
            </div>
            <Link href={`/store/${product.slug}`} className="mt-2 block text-lg font-semibold leading-snug text-foreground transition hover:text-primary">
              {product.name}
            </Link>
          </div>
          <Button
            type="button"
            onClick={() => toggle(product.id)}
            className={cn(
              "min-h-10 min-w-10 rounded-full border-white/70 bg-white/92 p-2 text-slate-700 shadow-sm",
              isLiked && "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
            aria-label="Toggle wishlist"
            variant="outline"
            size="icon"
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold tracking-tight">{formatCurrency(price)}</span>
          {originalPrice && (
            <span className="pb-0.5 text-sm text-muted-foreground line-through">{formatCurrency(originalPrice)}</span>
          )}
        </div>

        {"bestOffer" in product && product.bestOffer ? (
          <div className="rounded-2xl bg-[#fff3ea] p-3 text-xs text-[#6f4f43]">
            <p className="flex items-center gap-1 font-medium text-[#3c2a25]"><Store className="h-3.5 w-3.5" /> Best offer by {product.bestOffer.store?.name ?? "Vendor"}</p>
            <p>{product.offerCount} vendor offer{product.offerCount === 1 ? "" : "s"}</p>
          </div>
        ) : null}

        {existing ? (
          <div className="space-y-2">
            <div className="inline-flex min-h-11 w-full items-center justify-between rounded-full border border-border/70 bg-background/90 px-1">
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
            className="h-11 w-full"
          >
            <ShoppingCart className="h-4 w-4" />
            {outOfStock ? "Out of stock" : "Add to cart"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
