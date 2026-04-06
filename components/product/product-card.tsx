"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Minus, Play, Plus, ShoppingCart, Star, Store, Trash2 } from "lucide-react";
import { Product } from "@/types/ecommerce";
import { ProductListItemDto } from "@/types/api";
import { formatCurrency } from "@/lib/utils";
import { useWishlistStore } from "@/features/wishlist/store";
import { useCartStore } from "@/features/cart/store";
import { getCartLineIdentity } from "@/lib/cart-customization";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ProductCardData = Product | ProductListItemDto;

function inferMediaTypeFromUrl(url: string): "image" | "video" {
  const normalized = url.trim().toLowerCase();
  if (normalized.includes("/video/upload/") || /\.(mp4|webm|mov|mkv|m4v)(\?|$)/i.test(normalized)) {
    return "video";
  }
  return "image";
}

function deriveCloudinaryVideoThumbnail(url: string) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) {
    return undefined;
  }

  const [base, query = ""] = url.split("?");
  const withFrame = base.replace("/video/upload/", "/video/upload/so_0/");
  const asImage = /\.[a-z0-9]+$/i.test(withFrame)
    ? withFrame.replace(/\.[a-z0-9]+$/i, ".jpg")
    : `${withFrame}.jpg`;

  return query ? `${asImage}?${query}` : asImage;
}

export function ProductCard({ 
  product,
  layout = "grid"
}: { 
  product: ProductCardData;
  layout?: "grid" | "list";
}) {
  const { items, addItem, removeItem, updateQty } = useCartStore();
  const { productIds, toggle } = useWishlistStore();

  const isLiked = productIds.includes(product.id);
  const hasVariants = (product.attributes?.length ?? 0) > 0 && (product.variants?.length ?? 0) > 0;
  const variantMinPrice = hasVariants ? Math.min(...(product.variants ?? []).map((variant) => variant.salePrice)) : undefined;
  const price = hasVariants
    ? (variantMinPrice ?? product.price)
    : ("bestOffer" in product && product.bestOffer?.price ? product.bestOffer.price : product.price);
  const originalPrice = hasVariants
    ? undefined
    : ("bestOffer" in product && product.bestOffer?.originalPrice
    ? product.bestOffer.originalPrice
    : product.originalPrice);
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;
  const minQty = product.minOrderQty ?? 1;
  const maxQty = product.maxOrderQty ?? 10;
  const outOfStock = !product.inStock || maxQty === 0;
  const firstMedia = product.media?.[0] ?? {
    type: inferMediaTypeFromUrl(product.images[0] ?? ""),
    url: product.images[0],
    thumbnailUrl: product.images[0],
  };
  const mediaPreview = firstMedia.type === "video"
    ? (firstMedia.thumbnailUrl || deriveCloudinaryVideoThumbnail(firstMedia.url) || product.images[0])
    : firstMedia.url;

  const baseLineIdentity = getCartLineIdentity({
    productId: product.id,
    variantId: undefined,
    customizationSignature: undefined,
  });
  const existing = items.find((item) => getCartLineIdentity(item) === baseLineIdentity);
  const currentQty = existing?.quantity ?? 0;
  const productDescription = (product.shortDescription ?? product.description ?? "").trim();

  if (layout === "list") {
    return (
      <Card className="group relative isolate overflow-hidden rounded-[1.7rem] border border-[#e7d4c8] bg-[linear-gradient(130deg,rgba(255,255,255,0.92)_0%,rgba(255,247,238,0.92)_38%,rgba(255,255,255,0.96)_100%)] shadow-[0_28px_70px_-50px_rgba(56,34,27,0.62)] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_34px_76px_-52px_rgba(56,34,27,0.72)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_0%,rgba(205,153,51,0.2),transparent_45%),radial-gradient(120%_110%_at_0%_100%,rgba(255,173,130,0.16),transparent_44%)]" />

        <div className="relative flex flex-col lg:flex-row">
          <Link href={`/store/${product.slug}`} className="relative block aspect-16/11 w-full shrink-0 overflow-hidden bg-[#f8ede5] lg:h-auto lg:w-70 lg:aspect-auto">
          <Image
            src={mediaPreview}
            alt={product.name}
            fill
            className="object-cover transition duration-700 group-hover:scale-110"
            sizes="(max-width: 1024px) 100vw, 280px"
          />
          {firstMedia.type === "video" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
                <Play className="h-4 w-4" />
              </span>
            </div>
          ) : null}
          <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-black/28 to-transparent" />
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
            {product.featured && <Badge className="text-[10px]">Featured</Badge>}
            {discount > 0 ? <Badge variant="warning" className="border-0 bg-white/90 text-[10px] text-[#7b3d15]">{discount}% OFF</Badge> : null}
          </div>
          <div className="absolute bottom-2.5 left-2.5 rounded-full bg-slate-950/78 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
            {product.category}
          </div>
          </Link>

          <CardContent className="grid flex-1 grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-6 lg:p-6">
            <div className="min-w-0">
              <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-[#ead7cb] bg-white/80 px-2.5 py-1 text-xs text-slate-700">
                <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                <span className="font-semibold text-slate-900">{product.rating.toFixed(1)}</span>
                <span className="text-slate-500">{product.reviews} reviews</span>
              </div>

              <Link href={`/store/${product.slug}`} className="block text-xl font-semibold leading-snug text-slate-900 transition hover:text-primary">
                {product.name}
              </Link>

              {productDescription ? (
                <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-slate-600 sm:text-[0.92rem]">
                  {productDescription}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="text-2xl font-bold tracking-tight text-slate-950">
                  {hasVariants ? `From ${formatCurrency(price)}` : formatCurrency(price)}
                </span>
                {originalPrice ? (
                  <span className="pb-0.5 text-sm text-slate-500 line-through">{formatCurrency(originalPrice)}</span>
                ) : null}
              </div>

              {"bestOffer" in product && product.bestOffer ? (
                <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-xl border border-[#efd4c4] bg-[#fff4ec] px-3 py-1.5 text-[11px] text-[#6f4f43]">
                  <Store className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Best offer by {product.bestOffer.store?.name ?? "Vendor"}</span>
                </div>
              ) : null}
            </div>

            <div className="flex h-full flex-col">
              <div className="mb-4 flex justify-end">
                <Button
                  type="button"
                  onClick={() => toggle(product.id)}
                  className={cn(
                    "min-h-11 min-w-11 rounded-full border border-[#ddd4cd] bg-white p-2.5 text-slate-700 shadow-[0_8px_22px_-16px_rgba(40,24,16,0.55)]",
                    isLiked && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  aria-label="Toggle wishlist"
                  variant="outline"
                  size="icon"
                >
                  <Heart className="h-4.5 w-4.5" />
                </Button>
              </div>

              {hasVariants ? (
                <Button asChild type="button" className="mt-auto h-12 w-full rounded-2xl bg-[#cd9933] text-base font-semibold text-white hover:bg-[#b9882f]">
                  <Link href={`/store/${product.slug}`}>
                    Go to product
                  </Link>
                </Button>
              ) : existing ? (
                <div className="mt-auto space-y-2.5">
                  <div className="inline-flex min-h-11 w-full items-center justify-between rounded-full border border-border/70 bg-background/90 px-1">
                    <Button variant="ghost" size="icon" onClick={() => updateQty(product.id, currentQty - 1, minQty, maxQty, undefined, undefined)} disabled={currentQty <= minQty}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="px-2 text-sm font-medium">{currentQty}</span>
                    <Button variant="ghost" size="icon" onClick={() => updateQty(product.id, currentQty + 1, minQty, maxQty, undefined, undefined)} disabled={currentQty >= maxQty}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-muted-foreground">Min {minQty} • Max {maxQty}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(product.id, existing.variantId, existing.customizationSignature)}
                      className="h-8 gap-1 rounded-full border border-border/70 bg-transparent px-2 text-[11px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove ${product.name} from cart`}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
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
                      maxQty
                    )
                  }
                  disabled={outOfStock}
                  className="mt-auto h-12 w-full rounded-2xl bg-[#cd9933] text-base font-semibold text-white hover:bg-[#b9882f]"
                >
                  <ShoppingCart className="mr-2 h-4.5 w-4.5" />
                  {outOfStock ? "Out of stock" : "Add to cart"}
                </Button>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group glass-panel flex h-full flex-col overflow-hidden rounded-[1.45rem] border-white/60 shadow-[0_20px_46px_-36px_rgba(67,34,29,0.42)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_-38px_rgba(67,34,29,0.52)]">
      <Link href={`/store/${product.slug}`} className="relative block aspect-4/3 w-full shrink-0 overflow-hidden bg-[#f8ede5]">
        <Image
          src={mediaPreview}
          alt={product.name}
          fill
          className="object-cover transition duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        {firstMedia.type === "video" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
              <Play className="h-4 w-4" />
            </span>
          </div>
        ) : null}
        <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-black/28 to-transparent" />
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
          {product.featured && <Badge className="text-[10px]">Featured</Badge>}
          {discount > 0 ? <Badge variant="warning" className="border-0 bg-white/90 text-[10px] text-[#7b3d15]">{discount}% OFF</Badge> : null}
        </div>
        <div className="absolute bottom-2.5 left-2.5 rounded-full bg-slate-950/78 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
          {product.category}
        </div>
      </Link>

      <CardContent className="flex flex-1 flex-col gap-2.5 p-3.5 pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
              <span className="font-medium text-foreground">{product.rating}</span>
              <span>({product.reviews})</span>
            </div>
            <Link href={`/store/${product.slug}`} className="mt-1.5 block min-h-12 text-base font-semibold leading-snug text-foreground transition hover:text-primary">
              {product.name}
            </Link>
          </div>
          <Button
            type="button"
            onClick={() => toggle(product.id)}
            className={cn(
              "min-h-9 min-w-9 rounded-full border-white/70 bg-white/92 p-2 text-slate-700 shadow-sm",
              isLiked && "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
            aria-label="Toggle wishlist"
            variant="outline"
            size="icon"
          >
            <Heart className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-end gap-2">
          <span className="text-xl font-bold tracking-tight">{hasVariants ? `From ${formatCurrency(price)}` : formatCurrency(price)}</span>
          {originalPrice && (
            <span className="pb-0.5 text-xs text-muted-foreground line-through">{formatCurrency(originalPrice)}</span>
          )}
        </div>

        {"bestOffer" in product && product.bestOffer ? (
          <div className="rounded-xl bg-[#fff3ea] p-2.5 text-[11px] text-[#6f4f43]">
            <p className="flex items-center gap-1 font-medium text-[#3c2a25]"><Store className="h-3.5 w-3.5" /> Best offer by {product.bestOffer.store?.name ?? "Vendor"}</p>
          </div>
        ) : null}

        <div className="mt-auto">
        {hasVariants ? (
          <Button asChild type="button" className="h-10 w-full text-sm">
            <Link href={`/store/${product.slug}`}>
              Select variants
            </Link>
          </Button>
        ) : existing ? (
          <div className="space-y-2">
            <div className="inline-flex min-h-10 w-full items-center justify-between rounded-full border border-border/70 bg-background/90 px-1">
              <Button variant="ghost" size="icon" onClick={() => updateQty(product.id, currentQty - 1, minQty, maxQty, undefined, undefined)} disabled={currentQty <= minQty}>
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2 text-sm font-medium">{currentQty}</span>
              <Button variant="ghost" size="icon" onClick={() => updateQty(product.id, currentQty + 1, minQty, maxQty, undefined, undefined)} disabled={currentQty >= maxQty}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Min {minQty} • Max {maxQty}</p>
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
            className="h-10 w-full text-sm"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {outOfStock ? "Out of stock" : "Add to cart"}
          </Button>
        )}
        </div>
      </CardContent>
    </Card>
  );
}
