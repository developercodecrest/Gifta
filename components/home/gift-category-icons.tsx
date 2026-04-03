import Image from "next/image";
import Link from "next/link";

export interface HomeCategoryTile {
  id: string;
  name: string;
  href: string;
  image?: string;
}

function getCategoryInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  const initials = words.map((word) => word[0]).join("").toUpperCase();
  return initials || "GC";
}

export function GiftCategoryIcon({ category }: { category: HomeCategoryTile }) {
  return (
    <Link
      href={category.href}
      className="group flex flex-col items-center gap-2.5 transition-all duration-300"
    >
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-red-50 via-red-100/80 to-red-100 p-1 shadow-md transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-lg sm:h-24 sm:w-24">
        <div className="absolute inset-0 rounded-full border border-red-200/60" />
        {category.image ? (
          <span className="relative block h-full w-full overflow-hidden rounded-full border border-white/80 bg-red-50">
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 80px, 96px"
            />
          </span>
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(254,228,236,0.95),rgba(255,243,247,0.98))] text-sm font-semibold uppercase tracking-[0.08em] text-red-700">
            {getCategoryInitials(category.name)}
          </span>
        )}
      </div>
      <span className="text-center text-xs font-semibold text-foreground transition group-hover:text-red-600 sm:text-sm">
        {category.name}
      </span>
    </Link>
  );
}

export function GiftCategoryHeroSection({ categories }: { categories: HomeCategoryTile[] }) {
  if (!categories.length) {
    return null;
  }

  return (
    <section className="space-y-5 py-6 sm:py-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">Find the perfect gift</p>
        <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
          Explore real categories
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">Tap a category to open products filtered by that category</p>
      </div>

      <div className="rounded-3xl border border-red-200/40 bg-linear-to-b from-red-50/50 to-orange-50/30 px-4 py-7 shadow-sm sm:px-6 sm:py-8 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-5 lg:grid-cols-8 lg:gap-3">
          {categories.map((category) => (
            <GiftCategoryIcon key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
