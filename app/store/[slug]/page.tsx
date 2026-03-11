import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Gift, ShieldCheck, Sparkles, Star, Store, Truck } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { TrackRecent } from "@/components/product/track-recent";
import { AddToCartInline } from "@/features/cart/ui/add-to-cart-inline";
import { RecentlyViewed } from "@/features/recent/ui/recently-viewed";
import { WishlistInlineButton } from "@/features/wishlist/ui/wishlist-inline-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { getItemBySlug } from "@/lib/server/ecommerce-service";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await getItemBySlug(slug).catch(() => null);
  const fallback = getProductBySlug(slug);

  if (!product && !fallback) {
    notFound();
  }

  const currentProduct = (product ?? fallback)!;
  const related = product?.suggestions ?? getRelatedProducts(currentProduct.id, currentProduct.category, 4);
  const galleryImages = currentProduct.images.filter(Boolean);
  const bestOffer = product?.offers?.[0];
  const activePrice = bestOffer?.price ?? currentProduct.price;
  const originalPrice = bestOffer?.originalPrice ?? currentProduct.originalPrice;
  const tags = Array.from(new Set([currentProduct.category, ...(currentProduct.tags ?? [])])).slice(0, 6);

  return (
    <div className="space-y-8 pb-8 sm:space-y-10 sm:pb-10">
      <TrackRecent productId={currentProduct.id} />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="transition hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/search" className="transition hover:text-foreground">Search</Link>
          <span>/</span>
          <span className="text-foreground">{currentProduct.name}</span>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
          <div className="space-y-4">
            <article className="surface-mesh soft-shadow relative aspect-[4/4.2] overflow-hidden rounded-4xl border border-white/70">
              <Image
                src={galleryImages[0]}
                alt={currentProduct.name}
                fill
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 52vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/15 via-transparent to-transparent" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                {currentProduct.featured ? <Badge className="border-0 bg-white/92 text-slate-900">Featured</Badge> : null}
                {currentProduct.inStock ? <Badge variant="secondary" className="border-0 bg-[#fff0e5] text-[#7b3d15]">Ready to ship</Badge> : null}
              </div>
            </article>

            {galleryImages.length > 1 ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {galleryImages.slice(1, 4).map((image, index) => (
                  <div key={`${image}-${index}`} className="relative aspect-4/3 overflow-hidden rounded-3xl border border-white/70 bg-white/80">
                    <Image src={image} alt={`${currentProduct.name} ${index + 2}`} fill className="object-cover" sizes="(max-width: 1280px) 33vw, 20vw" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <Card className="glass-panel rounded-4xl border-white/60 soft-shadow">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="border-0 bg-[#fff1e6] text-[#7b3d15]">{currentProduct.category}</Badge>
                  {tags.slice(1).map((tag) => (
                    <Badge key={tag} variant="outline" className="border-[#efc9ba] bg-white/70 text-slate-700">{tag}</Badge>
                  ))}
                </div>
                <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">{currentProduct.name}</h1>
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{currentProduct.description}</p>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <span className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">{formatCurrency(activePrice)}</span>
                {originalPrice ? <span className="pb-1 text-base text-muted-foreground line-through">{formatCurrency(originalPrice)}</span> : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoTile icon={Star} label="Ratings" value={`${product?.reviewSummary.averageRating ?? currentProduct.rating} from ${product?.reviewSummary.totalReviews ?? currentProduct.reviews} reviews`} />
                <InfoTile icon={Truck} label="Delivery" value="24-48 hours in major cities" />
                <InfoTile icon={Gift} label="Gift finish" value="Premium wrapping on select offers" />
                <InfoTile icon={ShieldCheck} label="Checkout" value="Verified vendors and secure payment" />
              </div>

              {bestOffer?.store?.name ? (
                <div className="rounded-3xl border border-[#efc9ba] bg-[#fff7f1] p-4 text-sm text-slate-700">
                  <p className="flex items-center gap-2 font-medium text-slate-900">
                    <Store className="h-4 w-4 text-primary" />
                    Lowest offer by
                    <Link href={`/search?q=${encodeURIComponent(bestOffer.store.name)}`} className="text-primary underline-offset-4 hover:underline">
                      {bestOffer.store.name}
                    </Link>
                  </p>
                </div>
              ) : null}

              <div className="grid gap-3 sm:flex sm:flex-wrap">
                <AddToCartInline
                  productId={currentProduct.id}
                  offerId={bestOffer?.id}
                  minQty={currentProduct.minOrderQty ?? 1}
                  maxQty={currentProduct.maxOrderQty ?? 10}
                  disabled={!currentProduct.inStock}
                />
                <WishlistInlineButton productId={currentProduct.id} />
              </div>

              <div className="rounded-3xl border border-white/70 bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Why this layout feels better</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  The product detail page now uses larger media, clearer offer hierarchy, warmer surfaces, and stronger supporting cues so key buying information lands faster.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {product?.offers?.length ? (
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
                          href={`/search?q=${encodeURIComponent(offer.store.name)}`}
                          className="underline-offset-4 hover:text-primary hover:underline"
                        >
                          {offer.store.name}
                        </Link>
                      ) : "Vendor"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">ETA {offer.deliveryEtaHours}h • {offer.inStock ? "In stock" : "Out of stock"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{formatCurrency(offer.price)}</p>
                    {offer.originalPrice ? <p className="text-sm text-muted-foreground line-through">{formatCurrency(offer.originalPrice)}</p> : null}
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
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
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
            <Button asChild variant="outline" className="mt-6 border-[#efc9ba] bg-white/80">
              <Link href="/search">
                Continue browsing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-display text-3xl font-semibold tracking-tight">You may also like</h2>
            <Separator className="flex-1" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
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
      <p className="mt-1 text-sm text-muted-foreground">{value}</p>
    </div>
  );
}
