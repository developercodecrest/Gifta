import Link from "next/link";
import { HeroSlider } from "@/components/home/hero-slider";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { getHomeData } from "@/lib/server/ecommerce-service";
import type { ProductListItemDto } from "@/types/api";

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
          {leadProducts.map((item) => (
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
