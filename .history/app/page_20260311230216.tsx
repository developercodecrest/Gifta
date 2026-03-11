import Link from "next/link";
import { HeroSlider } from "@/components/home/hero-slider";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { getHomeData } from "@/lib/server/ecommerce-service";
import type { ProductListItemDto } from "@/types/api";

const demoBestSeller: ProductListItemDto = {
  id: "demo-bestseller-golden-hamper",
  storeId: "demo-store-gifta",
  slug: "golden-celebration-hamper",
  name: "Golden Celebration Hamper",
  description: "A premium gifting hamper with chocolates, flowers, and a keepsake card for milestone celebrations.",
  price: 1499,
  originalPrice: 1899,
  rating: 4.8,
  reviews: 128,
  category: "Birthday",
  tags: ["premium", "same-day", "hamper"],
  images: ["https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=80"],
  inStock: true,
  minOrderQty: 1,
  maxOrderQty: 5,
  featured: true,
  offerCount: 1,
  bestOffer: {
    id: "demo-offer-golden-hamper",
    productId: "demo-bestseller-golden-hamper",
    storeId: "demo-store-gifta",
    price: 1499,
    originalPrice: 1899,
    inStock: true,
    deliveryEtaHours: 6,
    store: {
      id: "demo-store-gifta",
      name: "Gifta Studio",
      slug: "gifta-studio",
      rating: 4.8,
      active: true,
    },
  },
};

export default async function Home() {
  let featured: ProductListItemDto[] = [];
  let arrivals: ProductListItemDto[] = [];

  try {
    const homeData = await getHomeData();
    featured = homeData.featured;
    arrivals = homeData.topRated;
  } catch {
    featured = [];
    arrivals = [];
  }

  const leadProducts = (featured.length ? featured : arrivals).slice(0, 8);
  const bestSellerProducts = leadProducts.some((item) => item.id === demoBestSeller.id)
    ? leadProducts
    : [...leadProducts, demoBestSeller];
  const ratedProducts = (arrivals.length ? arrivals : featured).slice(0, 4);

  return (
    <div className="space-y-8 pb-10 sm:space-y-10 sm:pb-16">
      <section className="full-bleed overflow-hidden">
        <HeroSlider />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Trending now</p>
            <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">Bestsellers</h2>
          </div>
          <Button asChild>
            <Link href="/search?sort=rating">See top-rated gifts</Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {bestSellerProducts.map((item) => (
            <ProductCard key={`home-${item.id}`} product={item} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Top rated</p>
            <h3 className="font-display mt-2 text-3xl font-semibold">Best reviewed gifts</h3>
          </div>
          <Button asChild>
            <Link href="/search?sort=rating">View all</Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {ratedProducts.map((item) => (
            <ProductCard key={`rating-${item.id}`} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
