"use client";

import Link from "next/link";
import { Heart, Flower, Users, Briefcase, Sparkles } from "lucide-react";

interface GiftCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export const giftCategories: GiftCategory[] = [
  {
    id: "wife",
    name: "Gift for Wife",
    slug: "wife",
  },
  {
    id: "mom",
    name: "Gift for Mom",
    slug: "mom",
  },
  {
    id: "girlfriend",
    name: "Gift for Girlfriend",
    slug: "girlfriend",
  },
  {
    id: "sister",
    name: "Gifts for Sister",
    slug: "sister",
  },
  {
    id: "dad",
    name: "Gift for Dad",
    slug: "dad",
  },
  {
    id: "husband",
    name: "Gift for Husband",
    slug: "husband",
  },
  {
    id: "boyfriend",
    name: "Gift for Boyfriend",
    slug: "boyfriend",
  },
  {
    id: "couple",
    name: "Gifts For Couple",
    slug: "couple",
  },
];

// Professional Lucide React icons for each category
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  wife: Heart,
  mom: Flower,
  girlfriend: Heart,
  sister: Users,
  dad: Briefcase,
  husband: Heart,
  boyfriend: Sparkles,
  couple: Users,
};

function CategoryIcon({ slug }: { slug: string }) {
  const Icon = categoryIcons[slug] || Heart;
  return <Icon className="h-12 w-12 text-red-600" />;
}

export function GiftCategoryIcon({ category }: { category: GiftCategory }) {
  return (
    <Link
      href={`/recipients/${category.slug}`}
      className="group flex flex-col items-center gap-2.5 transition-all duration-300"
    >
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-red-50 via-red-100/80 to-red-100 p-3 shadow-md transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-lg sm:h-24 sm:w-24">
        <div className="absolute inset-0 rounded-full border border-red-200/60" />
        <div className="relative">
          <CategoryIcon slug={category.slug} />
        </div>
      </div>
      <span className="text-center text-xs font-semibold text-foreground transition group-hover:text-red-600 sm:text-sm">
        {category.name}
      </span>
    </Link>
  );
}

export function GiftCategoryHeroSection() {
  return (
    <section className="space-y-5 py-6 sm:py-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">Find the perfect gift</p>
        <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
          Choose by recipient
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">Browse gifts for every special person in your life</p>
      </div>

      <div className="rounded-3xl border border-red-200/40 bg-linear-to-b from-red-50/50 to-orange-50/30 px-4 py-7 shadow-sm sm:px-6 sm:py-8 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-5 lg:grid-cols-8 lg:gap-3">
          {giftCategories.map((category) => (
            <GiftCategoryIcon key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
