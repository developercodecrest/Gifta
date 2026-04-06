import Link from "next/link";
import { notFound } from "next/navigation";
import { Gift, ShieldCheck, Star, Truck } from "lucide-react";
import { InlineProductSuggestions } from "@/components/product/inline-product-suggestions";
import { ProductMediaGallery } from "@/components/product/product-media-gallery";
import { ProductContentTabs } from "@/components/product/product-content-tabs";
import { TrackRecent } from "@/components/product/track-recent";
import { ProductOrderPanel } from "@/features/cart/ui/product-order-panel";
import { RecentlyViewed } from "@/features/recent/ui/recently-viewed";
import { WishlistInlineButton } from "@/features/wishlist/ui/wishlist-inline-button";
import { Badge } from "@/components/ui/badge";
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
              <div className="space-y-2.5">
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

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  {originalPrice ? <span className="text-xl text-[#74655c] line-through">{formatCurrency(originalPrice)}</span> : null}
                  <span className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                    {hasVariants ? `From ${formatCurrency(activePrice ?? 0)}` : formatCurrency(activePrice ?? 0)}
                  </span>
                  {discountPercent > 0 ? (
                    <Badge className="rounded-md border-0 bg-[#e43d3d] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white">
                      Save {discountPercent}%
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-[#5f5047]">MRP / Special Price (Tax Included)</p>
                <Separator />
              </div>

              <div>
                <ProductOrderPanel
                  productId={currentProduct.id}
                  offerId={bestOffer?.id}
                  minQty={currentProduct.minOrderQty ?? 1}
                  maxQty={currentProduct.maxOrderQty ?? 10}
                  disabled={!currentProduct.inStock}
                  attributes={currentProduct.attributes}
                  variants={currentProduct.variants}
                  customizable={isCustomizable}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <InfoTile icon={Star} label="Ratings" value={`${product?.reviewSummary.averageRating ?? currentProduct.rating} from ${product?.reviewSummary.totalReviews ?? currentProduct.reviews} reviews`} />
                <InfoTile icon={Truck} label="Delivery" value="24-48 hours in major cities" />
                <InfoTile icon={Gift} label="Gift finish" value="Premium wrapping on select offers" />
                <InfoTile icon={ShieldCheck} label="Checkout" value="Verified vendors and secure payment" />
              </div>

              <div>
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
