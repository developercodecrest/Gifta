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
      className="group flex flex-col items-center gap-3 transition-all duration-300"
    >
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(255,243,224,0.98),rgba(255,229,238,0.92)_52%,rgba(250,235,205,0.98)_100%)] p-1.5 shadow-[0_18px_30px_-24px_rgba(93,58,20,0.38)] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_20px_34px_-22px_rgba(93,58,20,0.44)] sm:h-24 sm:w-24 lg:h-28 lg:w-28">
        <div className="absolute inset-0 rounded-full border border-[#f0d8b6]" />
        {category.image ? (
          <span className="relative block h-full w-full overflow-hidden rounded-full border border-white/90 bg-[#fff5ec]">
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 80px, (max-width: 1024px) 96px, 112px"
            />
          </span>
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(255,239,209,0.98),rgba(255,245,235,0.98))] text-sm font-semibold uppercase tracking-[0.1em] text-[#8c621d]">
            {getCategoryInitials(category.name)}
          </span>
        )}
      </div>
      <span className="text-center text-[0.78rem] font-semibold leading-5 text-foreground transition group-hover:text-[#8c621d] sm:text-sm">
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
    <section className="space-y-6 py-6 sm:py-9">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9e7526]">Find the perfect gift</p>
        <h2 className="gc-title text-2xl text-foreground sm:text-3xl md:text-4xl">
          Explore real categories
        </h2>
      </div>

      <div className="rounded-[2rem] border border-[#f0dbc0] bg-[linear-gradient(180deg,rgba(255,252,247,0.96),rgba(255,245,233,0.98)_100%)] px-4 py-6 shadow-[0_22px_46px_-36px_rgba(95,69,20,0.24)] sm:px-6 sm:py-8 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-5 xl:grid-cols-8 xl:gap-3">
          {categories.map((category) => (
            <GiftCategoryIcon key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
