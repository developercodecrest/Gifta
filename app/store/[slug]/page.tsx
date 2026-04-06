import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Gift, ShieldCheck, Sparkles, Star, Truck } from "lucide-react";
import { InlineProductSuggestions } from "@/components/product/inline-product-suggestions";
import { ProductMediaGallery } from "@/components/product/product-media-gallery";
import { ProductCard } from "@/components/product/product-card";
import { ProductContentTabs } from "@/components/product/product-content-tabs";
import { TrackRecent } from "@/components/product/track-recent";
import { ProductOrderPanel } from "@/features/cart/ui/product-order-panel";
import { RecentlyViewed } from "@/features/recent/ui/recently-viewed";
import { WishlistInlineButton } from "@/features/wishlist/ui/wishlist-inline-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { getCustomizableCategoryValues, getItemBySlug } from "@/lib/server/ecommerce-service";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await getItemBySlug(slug).catch(() => null);
  const fallback = getProductBySlug(slug);
  const customizableCategories = await getCustomizableCategoryValues().catch(() => [] as string[]);

  if (!product && !fallback) {
    notFound();
  }

  const currentProduct = (product ?? fallback)!;
  const related = product?.suggestions ?? getRelatedProducts(currentProduct.id, currentProduct.category, 4);
  const bestOffer = product?.offers?.[0];
  const hasVariants = (currentProduct.attributes?.length ?? 0) > 0 && (currentProduct.variants?.length ?? 0) > 0;
  const lowestVariantPrice = hasVariants
    ? Math.min(...(currentProduct.variants ?? []).map((variant) => variant.salePrice))
    : undefined;
  const activePrice = hasVariants ? lowestVariantPrice : (bestOffer?.price ?? currentProduct.price);
  const originalPrice = hasVariants
    ? undefined
    : (bestOffer?.originalPrice ?? currentProduct.originalPrice);
  const discountPercent = originalPrice && activePrice && originalPrice > activePrice
    ? Math.round(((originalPrice - activePrice) / originalPrice) * 100)
    : 0;
  const tags = Array.from(new Set([currentProduct.category, ...(currentProduct.tags ?? [])])).slice(0, 6);
  const sku = currentProduct.id.toUpperCase();
  const isCustomizable = customizableCategories.includes(currentProduct.category);

  return (
    <div className="space-y-6 pb-8 sm:space-y-8 sm:pb-10">
      <TrackRecent productId={currentProduct.id} />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#74655c]">
          <Link href="/" className="transition hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/products" className="transition hover:text-foreground">Products</Link>
          <span>/</span>
          <span className="text-foreground">{currentProduct.name}</span>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
          <div className="space-y-3">
            <div className="relative">
              <ProductMediaGallery media={currentProduct.media} images={currentProduct.images} productName={currentProduct.name} />
              <div className="absolute right-4 top-4 z-10">
                <WishlistInlineButton productId={currentProduct.id} iconOnly />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentProduct.featured ? <Badge className="border-0 bg-white/92 text-slate-900">Featured</Badge> : null}
              {currentProduct.inStock ? <Badge variant="secondary" className="border-0 bg-[#fff0e5] text-[#7b3d15]">Ready to ship</Badge> : null}
            </div>
          </div>

          <Card className="glass-panel rounded-4xl border-white/60 soft-shadow">
            <CardContent className="flex flex-col gap-3 p-4 sm:p-5 lg:p-5">
              <div className="order-1 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="border-0 bg-[#fff1e6] text-[#7b3d15]">{currentProduct.category}</Badge>
                  {tags.slice(1, 4).map((tag) => (
                    <Badge key={tag} variant="outline" className="border-[#e4cf9e] bg-white/82 text-slate-700">{tag}</Badge>
                  ))}
                </div>
                <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">{currentProduct.name}</h1>
                {bestOffer?.store?.name ? (
                  <p className="text-xs text-[#74655c] sm:text-sm">
                    Sold by{" "}
                    <Link href={`/products?q=${encodeURIComponent(bestOffer.store.name)}`} className="font-medium text-primary underline-offset-4 hover:underline">
                      {bestOffer.store.name}
                    </Link>
                  </p>
                ) : null}
                <p className="max-w-2xl text-sm text-[#5f5047] sm:text-base">{currentProduct.shortDescription || currentProduct.description}</p>
              </div>

              <div className="order-2 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  {originalPrice ? <span className="text-2xl text-[#74655c] line-through">{formatCurrency(originalPrice)}</span> : null}
                  <span className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                    {hasVariants ? `From ${formatCurrency(activePrice ?? 0)}` : formatCurrency(activePrice ?? 0)}
                  </span>
                  {discountPercent > 0 ? (
                    <Badge className="rounded-md border-0 bg-[#e43d3d] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white">
                      Save {discountPercent}%
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-[#5f5047]">MRP / Special Price (Tax Included)</p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-[#e53e3e]">Free Shipping | COD Available</span>
                  <span className="text-[#74655c]">SKU: {sku}</span>
                </div>
                <Separator />
              </div>

              <div className="order-5 grid gap-2 sm:grid-cols-2 md:order-3">
                <InfoTile icon={Star} label="Ratings" value={`${product?.reviewSummary.averageRating ?? currentProduct.rating} from ${product?.reviewSummary.totalReviews ?? currentProduct.reviews} reviews`} />
                <InfoTile icon={Truck} label="Delivery" value="24-48 hours in major cities" />
                <InfoTile icon={Gift} label="Gift finish" value="Premium wrapping on select offers" />
                <InfoTile icon={ShieldCheck} label="Checkout" value="Verified vendors and secure payment" />
              </div>

              <div className="order-3 md:order-4">
                <ProductOrderPanel
                  productId={currentProduct.id}
                  offerId={bestOffer?.id}
                  minQty={currentProduct.minOrderQty ?? 1}
                  maxQty={currentProduct.maxOrderQty ?? 10}
                  disabled={!currentProduct.inStock}
                  attributes={currentProduct.attributes}
                  variants={currentProduct.variants}
                  fallbackPrice={bestOffer?.price ?? currentProduct.price}
                  fallbackOriginalPrice={bestOffer?.originalPrice ?? currentProduct.originalPrice}
                  customizable={isCustomizable}
                />
              </div>

              <div className="order-4 md:order-5">
                <InlineProductSuggestions items={related} />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Product details</h2>
          <Separator className="flex-1" />
        </div>
        <ProductContentTabs
          descriptionHtml={currentProduct.description}
          howToPersonaliseHtml={currentProduct.howToPersonaliseHtml}
          brandDetailsHtml={currentProduct.brandDetailsHtml}
          disclaimerHtml={currentProduct.disclaimerHtml}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <Card className="surface-mesh rounded-4xl border-white/60">
          <CardContent className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Gifting notes</p>
            <h2 className="font-display mt-3 text-3xl font-semibold">A warmer, more premium single-item page</h2>
            <p className="mt-3 text-sm text-[#5f5047] sm:text-base">
              Larger imagery, more expressive typography, and clearer price and delivery cues help the product page feel closer to a luxury gifting destination.
            </p>
            <div className="mt-6 grid gap-3">
              {tags.map((tag) => (
                <div key={tag} className="flex items-center justify-between rounded-[1.1rem] border border-white/70 bg-white/75 px-4 py-3 text-sm font-medium">
                  <span>{tag}</span>
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
              ))}
            </div>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/products">
                Continue browsing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="glass-panel rounded-4xl border-white/60">
            <CardContent className="p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Shipping and Returns</p>
              <p className="mt-3 text-sm leading-7 text-[#5f5047] sm:text-base">
                Dispatch usually happens within 24 hours for active offers. Delivery ETA depends on your selected vendor and city. Returns are accepted only for damaged deliveries and must be reported with unboxing proof.
              </p>
            </CardContent>
          </Card>

          <div>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-display text-3xl font-semibold tracking-tight">You may also like</h2>
            <Separator className="flex-1" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
          </div>
        </div>
      </section>

      <RecentlyViewed currentId={currentProduct.id} />
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Star;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/75 p-3">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-sm font-semibold">{label}</p>
      <p className="mt-1 text-sm text-[#5f5047]">{value}</p>
    </div>
  );
}
