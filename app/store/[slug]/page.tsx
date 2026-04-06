import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Gift, ShieldCheck, Sparkles, Star, Store, Truck } from "lucide-react";
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
  const tags = Array.from(new Set([currentProduct.category, ...(currentProduct.tags ?? [])])).slice(0, 6);
  const isCustomizable = customizableCategories.includes(currentProduct.category);

  return (
    <div className="space-y-8 pb-8 sm:space-y-10 sm:pb-10">
      <TrackRecent productId={currentProduct.id} />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#74655c]">
          <Link href="/" className="transition hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/products" className="transition hover:text-foreground">Products</Link>
          <span>/</span>
          <span className="text-foreground">{currentProduct.name}</span>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
          <div className="space-y-3">
            <ProductMediaGallery media={currentProduct.media} images={currentProduct.images} productName={currentProduct.name} />
            <div className="flex flex-wrap gap-2">
              {currentProduct.featured ? <Badge className="border-0 bg-white/92 text-slate-900">Featured</Badge> : null}
              {currentProduct.inStock ? <Badge variant="secondary" className="border-0 bg-[#fff0e5] text-[#7b3d15]">Ready to ship</Badge> : null}
            </div>
          </div>

          <Card className="glass-panel rounded-4xl border-white/60 soft-shadow">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="border-0 bg-[#fff1e6] text-[#7b3d15]">{currentProduct.category}</Badge>
                  {tags.slice(1).map((tag) => (
                    <Badge key={tag} variant="outline" className="border-[#e4cf9e] bg-white/82 text-slate-700">{tag}</Badge>
                  ))}
                </div>
                <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">{currentProduct.name}</h1>
                <p className="max-w-2xl text-sm text-[#5f5047] sm:text-base">{currentProduct.shortDescription || currentProduct.description}</p>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <span className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                  {hasVariants ? `From ${formatCurrency(activePrice ?? 0)}` : formatCurrency(activePrice ?? 0)}
                </span>
                {originalPrice ? <span className="pb-1 text-base text-[#74655c] line-through">{formatCurrency(originalPrice)}</span> : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoTile icon={Star} label="Ratings" value={`${product?.reviewSummary.averageRating ?? currentProduct.rating} from ${product?.reviewSummary.totalReviews ?? currentProduct.reviews} reviews`} />
                <InfoTile icon={Truck} label="Delivery" value="24-48 hours in major cities" />
                <InfoTile icon={Gift} label="Gift finish" value="Premium wrapping on select offers" />
                <InfoTile icon={ShieldCheck} label="Checkout" value="Verified vendors and secure payment" />
              </div>

              {bestOffer?.store?.name ? (
                <div className="rounded-3xl border border-[#e4cf9e] bg-[#fffaf0] p-4 text-sm text-slate-700">
                  <p className="flex items-center gap-2 font-medium text-slate-900">
                    <Store className="h-4 w-4 text-primary" />
                    Lowest offer by
                    <Link href={`/products?q=${encodeURIComponent(bestOffer.store.name)}`} className="text-primary underline-offset-4 hover:underline">
                      {bestOffer.store.name}
                    </Link>
                  </p>
                </div>
              ) : null}

              <div className="grid gap-3">
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
                <WishlistInlineButton productId={currentProduct.id} />
              </div>

              <div className="app-data-panel rounded-3xl p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Why this layout feels better</p>
                <p className="mt-2 text-sm text-[#5f5047]">
                  The product detail page now uses larger media, clearer offer hierarchy, warmer surfaces, and stronger supporting cues so key buying information lands faster.
                </p>
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

      {product?.offers?.length && !hasVariants ? (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-3xl font-semibold tracking-tight">Vendor offers</h2>
            <Separator className="flex-1" />
          </div>
          <div className="grid gap-3">
            {product.offers.map((offer) => (
              <Card key={offer.id} className="glass-panel rounded-3xl border-white/60">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-base font-semibold">
                      {offer.store?.name ? (
                        <Link
                          href={`/products?q=${encodeURIComponent(offer.store.name)}`}
                          className="underline-offset-4 hover:text-primary hover:underline"
                        >
                          {offer.store.name}
                        </Link>
                      ) : "Vendor"}
                    </p>
                    <p className="mt-1 text-sm text-[#5f5047]">ETA {offer.deliveryEtaHours}h • {offer.inStock ? "In stock" : "Out of stock"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{formatCurrency(offer.price)}</p>
                    {offer.originalPrice ? <p className="text-sm text-[#74655c] line-through">{formatCurrency(offer.originalPrice)}</p> : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

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
    <div className="rounded-[1.35rem] border border-white/70 bg-white/75 p-4">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-3 text-sm font-semibold">{label}</p>
            <p className="mt-1 text-sm text-[#5f5047]">{value}</p>
    </div>
  );
}
