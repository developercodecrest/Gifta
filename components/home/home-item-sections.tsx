"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import type { ProductListItemDto } from "@/types/api";

type FilterConfig = {
  label: string;
  predicate: (item: ProductListItemDto) => boolean;
};

const curatedFilters: FilterConfig[] = [
  { label: "Top control", predicate: () => true },
  { label: "Gift sets", predicate: (item) => item.category === "Festive" },
  { label: "Invisible line", predicate: (item) => item.tags.includes("premium") },
  { label: "New arrivals", predicate: (item) => Boolean(item.featured) },
  { label: "Best sellers", predicate: (item) => item.rating >= 4.5 },
];

const arrivalFilters: FilterConfig[] = [
  { label: "Latest drops", predicate: () => true },
  { label: "Top rated", predicate: (item) => item.rating >= 4.5 },
  { label: "Same day", predicate: (item) => item.tags.includes("same-day") },
  { label: "Premium", predicate: (item) => item.tags.includes("premium") },
  { label: "Birthday", predicate: (item) => item.category === "Birthday" },
];

export function HomeItemSections({
  featured,
  arrivals,
}: {
  featured: ProductListItemDto[];
  arrivals: ProductListItemDto[];
}) {
  const [activeCurated, setActiveCurated] = useState(0);
  const [activeArrivals, setActiveArrivals] = useState(0);

  const filteredFeatured = useMemo(() => {
    const filter = curatedFilters[activeCurated] ?? curatedFilters[0];
    return featured.filter(filter.predicate);
  }, [activeCurated, featured]);

  const filteredArrivals = useMemo(() => {
    const filter = arrivalFilters[activeArrivals] ?? arrivalFilters[0];
    return arrivals.filter(filter.predicate);
  }, [activeArrivals, arrivals]);

  return (
    <>
      <section
        aria-label="Collections"
        className="relative overflow-hidden rounded-[2.5rem] border border-border/50 bg-card/40 p-5 sm:p-8 lg:p-10"
      >
        <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-secondary/40 blur-3xl sm:-right-40 sm:-top-40 sm:h-80 sm:w-80" />
        <div className="relative z-10 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Collections</p>
          <div className="flex items-center gap-4">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] sm:text-4xl">Curated seasonal picks</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
          </div>
        </div>
        <p className="relative z-10 mt-3 max-w-2xl text-base text-muted-foreground">Explore signature collections with premium quality, trending styles, and delightful packaging.</p>
        <div className="relative z-10 mt-8 flex flex-wrap gap-3">
          {curatedFilters.map((tag, i) => (
            <button
              key={tag.label}
              type="button"
              onClick={() => setActiveCurated(i)}
              className={`relative overflow-hidden rounded-full bg-[color:var(--brand-gold)] px-5 py-2.5 text-[0.82rem] font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:bg-[color:var(--brand-gold-strong)] ${
                i === activeCurated
                  ? "opacity-100 shadow-[0_18px_32px_-18px_rgba(205,153,51,0.78)] ring-2 ring-white/80"
                  : "opacity-80"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
        <div className="relative z-10 mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filteredFeatured.length > 0 ? (
            filteredFeatured.map((item) => <ProductCard key={item.id} product={item} />)
          ) : (
            <div className="col-span-full rounded-[2rem] border border-dashed border-border bg-background/50 p-8 text-center text-sm text-muted-foreground">
              No items match this filter.
            </div>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-secondary/30 via-background to-primary/5 p-5 sm:p-8 lg:p-10" aria-label="New arrivals">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
        <div className="relative z-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Latest drop</p>
          <h2 className="font-display mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">New Arrivals</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Freshly added gifting picks with high ratings, premium finish, and fast delivery options.
          </p>
        </div>
        <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-3">
          {arrivalFilters.map((tag, i) => (
            <button
              key={tag.label}
              type="button"
              onClick={() => setActiveArrivals(i)}
              className={`relative overflow-hidden rounded-full bg-[color:var(--brand-gold)] px-5 py-2.5 text-[0.82rem] font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:bg-[color:var(--brand-gold-strong)] ${
                i === activeArrivals
                  ? "opacity-100 shadow-[0_18px_32px_-18px_rgba(205,153,51,0.78)] ring-2 ring-white/80"
                  : "opacity-80"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
        <div className="relative z-10 mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filteredArrivals.length > 0 ? (
            filteredArrivals.map((item) => <ProductCard key={`arrival-${item.id}`} product={item} />)
          ) : (
            <div className="col-span-full rounded-[2rem] border border-dashed border-border bg-background/50 p-8 text-center text-sm text-muted-foreground">
              No items match this filter.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
