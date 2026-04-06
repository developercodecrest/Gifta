"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import type { ProductListItemDto } from "@/types/api";
import { ChevronRight } from "lucide-react";

type RecipientCategory = {
  id: string;
  name: string;
  slug: string;
};

const giftCategories: RecipientCategory[] = [
  { id: "wife", name: "Wife", slug: "wife" },
  { id: "mom", name: "Mom", slug: "mom" },
  { id: "girlfriend", name: "Girlfriend", slug: "girlfriend" },
  { id: "sister", name: "Sister", slug: "sister" },
  { id: "dad", name: "Dad", slug: "dad" },
  { id: "husband", name: "Husband", slug: "husband" },
  { id: "boyfriend", name: "Boyfriend", slug: "boyfriend" },
  { id: "couple", name: "Couple", slug: "couple" },
];

// Sample product data - in production, fetch from your API based on the slug
const getProductsForCategory = (slug: string): ProductListItemDto[] => {
  // This is demo data. In production, filter products from your API
  const demoProducts: Record<string, ProductListItemDto[]> = {
    wife: [],
    mom: [],
    girlfriend: [],
    sister: [],
    dad: [],
    husband: [],
    boyfriend: [],
    couple: [],
  };

  // Return products for the category, or empty array if not found
  return demoProducts[slug] || [];
};

const getCategoryInfo = (slug: string) => {
  const category = giftCategories.find((cat) => cat.slug === slug);
  return category || null;
};

const getRelatedCategories = (currentSlug: string) => {
  return giftCategories.filter((cat) => cat.slug !== currentSlug);
};

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const category = getCategoryInfo(slug);
  const [sortBy, setSortBy] = useState<"rating" | "price-low" | "price-high">("rating");

  if (!category) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-3xl font-bold">Category not found</h1>
        <p className="text-lg text-muted-foreground">We couldn&apos;t find the category you&apos;re looking for.</p>
        <Button asChild>
          <Link href="/products">Back to products</Link>
        </Button>
      </div>
    );
  }

  const products = getProductsForCategory(slug);
  const relatedCategories = getRelatedCategories(slug);

  const getCategoryDescription = (slug: string): string => {
    const descriptions: Record<string, string> = {
      wife: "Discover thoughtful, romantic, and premium gift ideas perfect for your wife. From personalized keepsakes to luxurious hampers.",
      mom: "Celebrate motherhood with carefully curated gifts that show your love and appreciation. Find perfect presents for every mom.",
      girlfriend: "Express your affection with beautiful and meaningful gifts for your girlfriend. Premium picks for special moments.",
      sister: "Surprise your sister with gifts that match her personality. Stylish, fun, and memorable presents for every occasion.",
      dad: "Honor your dad with premium gifts he'll love. From classic to modern, find the perfect present for every father.",
      husband: "Show your husband how much he means with thoughtful and quality gifts. Premium selections for special moments.",
      boyfriend: "Impress your boyfriend with cool, meaningful gifts. Find presents that match his style and interests.",
      couple: "Celebrate your relationship with gifts designed for couples. Perfect for anniversaries, engagements, and special moments.",
    };

    return descriptions[slug] || "Browse our curated collection of gifts for your special person.";
  };

  return (
    <div className="space-y-10 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-4xl border border-red-200/40 bg-linear-to-br from-red-50/50 to-orange-50/30 px-6 py-12 shadow-sm sm:px-8 sm:py-16 lg:px-12">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-red-200/20 blur-3xl" />
        <div className="relative z-10 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">Gift recipient</p>
          <h1 className="font-display text-4xl font-bold text-foreground sm:text-5xl md:text-6xl">
            {category.name}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
            {getCategoryDescription(slug)}
          </p>
        </div>
      </section>

      {/* Filters and Products Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Perfect gifts for {category.name.toLowerCase()}</h2>
            <p className="text-sm text-muted-foreground">Showing {products.length} products</p>
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "rating" | "price-low" | "price-high")}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-secondary"
            >
              <option value="rating">Top Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-background/50 p-12 text-center">
            <p className="mb-4 text-lg font-semibold text-foreground">No products found yet</p>
            <p className="mb-6 text-muted-foreground">
              Check back soon for amazing gifts for {category.name.toLowerCase()}!
            </p>
            <Button asChild variant="outline">
              <Link href="/products">Explore all gifts</Link>
            </Button>
          </div>
        )}
      </section>

      {/* Related Categories Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">Explore other recipients</h2>
          <p className="text-sm text-muted-foreground">Find gifts for other special people</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {relatedCategories.map((relatedCategory) => (
            <Link
              key={relatedCategory.id}
              href={`/recipients/${relatedCategory.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition hover:border-red-300 hover:shadow-md sm:p-6"
            >
              <div className="absolute inset-0 bg-linear-to-br from-red-100/0 to-red-100/5 opacity-0 transition group-hover:opacity-100" />
              <div className="relative z-10 space-y-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 transition group-hover:bg-red-200">
                  <span className="text-lg">♥️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground transition group-hover:text-red-600">
                    {relatedCategory.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">Browse gifts</p>
                </div>
              </div>
              <ChevronRight className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden rounded-4xl border border-red-200/50 bg-linear-to-r from-red-600 to-red-700 p-8 text-white shadow-lg sm:p-12 lg:p-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <h2 className="text-3xl font-bold sm:text-4xl">Can&apos;t find what you&apos;re looking for?</h2>
          <p className="text-lg text-red-100">
            Browse our complete collection or use our smart search to find the perfect gift.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary" className="bg-white text-red-600 hover:bg-red-50">
              <Link href="/products">Search all gifts</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
