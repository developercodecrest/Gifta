import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { TrackRecent } from "@/components/product/track-recent";
import { AddToCartInline } from "@/features/cart/ui/add-to-cart-inline";
import { RecentlyViewed } from "@/features/recent/ui/recently-viewed";
import { WishlistInlineButton } from "@/features/wishlist/ui/wishlist-inline-button";
import { products } from "@/data/products";
import { formatCurrency } from "@/lib/utils";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = getRelatedProducts(product.id, product.category, 4);

  return (
    <div className="space-y-10">
      <TrackRecent productId={product.id} />

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-white">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        <div className="space-y-5">
          <p className="text-sm font-medium uppercase tracking-wide text-muted">{product.category}</p>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-muted">{product.description}</p>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold">{formatCurrency(product.price)}</span>
            {product.originalPrice && (
              <span className="text-base text-muted line-through">{formatCurrency(product.originalPrice)}</span>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
            <p>⭐ {product.rating} rating from {product.reviews} reviews</p>
            <p className="mt-2">🚚 Delivery in 24-48 hours in major cities</p>
            <p className="mt-2">🎁 Complimentary premium wrapping with every order</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <AddToCartInline productId={product.id} disabled={!product.inStock} />
            <WishlistInlineButton productId={product.id} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">You may also like</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>

      <RecentlyViewed currentId={product.id} />
    </div>
  );
}
