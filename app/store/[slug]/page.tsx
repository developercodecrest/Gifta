import Image from "next/image";
import { notFound } from "next/navigation";
import { ShieldCheck, Star, Store, Truck } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { TrackRecent } from "@/components/product/track-recent";
import { AddToCartInline } from "@/features/cart/ui/add-to-cart-inline";
import { RecentlyViewed } from "@/features/recent/ui/recently-viewed";
import { WishlistInlineButton } from "@/features/wishlist/ui/wishlist-inline-button";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="space-y-8 sm:space-y-10">
      <TrackRecent productId={currentProduct.id} />

      <section className="grid gap-6 sm:gap-8 lg:grid-cols-2">
        <article className="relative aspect-square overflow-hidden rounded-xl border border-border bg-card">
          <Image
            src={currentProduct.images[0]}
            alt={currentProduct.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {currentProduct.featured && (
            <Badge className="absolute left-3 top-3">Featured</Badge>
          )}
        </article>

        <Card>
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{currentProduct.category}</p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{currentProduct.name}</h1>
              <p className="text-sm text-muted-foreground sm:text-base">{currentProduct.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primary">{formatCurrency(product?.offers?.[0]?.price ?? currentProduct.price)}</span>
              {(product?.offers?.[0]?.originalPrice ?? currentProduct.originalPrice) && (
                <span className="text-base text-muted-foreground line-through">{formatCurrency(product?.offers?.[0]?.originalPrice ?? currentProduct.originalPrice ?? 0)}</span>
              )}
            </div>

            <Separator />

            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> {product?.reviewSummary.averageRating ?? currentProduct.rating} rating from {product?.reviewSummary.totalReviews ?? currentProduct.reviews} reviews</p>
              <p className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Delivery in 24-48 hours in major cities</p>
              <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Complimentary premium wrapping with every order</p>
              {product?.offers?.[0]?.store?.name ? (
                <p className="flex items-center gap-2"><Store className="h-4 w-4 text-primary" /> Lowest offer by {product.offers[0].store.name}</p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <AddToCartInline
                productId={currentProduct.id}
                offerId={product?.offers?.[0]?.id}
                minQty={currentProduct.minOrderQty ?? 1}
                maxQty={currentProduct.maxOrderQty ?? 10}
                disabled={!currentProduct.inStock}
              />
              <WishlistInlineButton productId={currentProduct.id} />
            </div>
          </CardContent>
        </Card>
      </section>

      {product?.offers?.length ? (
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight">Vendor offers</h2>
            <Separator className="flex-1" />
          </div>
          <div className="grid gap-3">
            {product.offers.map((offer) => (
              <Card key={offer.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-semibold">{offer.store?.name ?? "Vendor"}</p>
                    <p className="text-xs text-muted-foreground">ETA {offer.deliveryEtaHours}h • {offer.inStock ? "In stock" : "Out of stock"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-primary">{formatCurrency(offer.price)}</p>
                    {offer.originalPrice ? <p className="text-xs text-muted-foreground line-through">{formatCurrency(offer.originalPrice)}</p> : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">You may also like</h2>
          <Separator className="flex-1" />
        </div>
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>

      <RecentlyViewed currentId={currentProduct.id} />
    </div>
  );
}
