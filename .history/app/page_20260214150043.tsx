import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Cake,
  Flower2,
  Heart,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function Home() {
  const quickFilters = [
    { label: "Same Day Delivery", href: "/store?tag=same-day", icon: Truck },
    { label: "Cakes", href: "/store?category=Birthday", icon: Cake },
    { label: "Flowers", href: "/store?category=Anniversary", icon: Flower2 },
    { label: "Personalized", href: "/store?tag=personalized", icon: Sparkles },
    { label: "New Arrivals", href: "/store?sort=newest", icon: BadgeCheck },
  ] as const;

  const demoProducts = [
    {
      id: "d-1",
      title: "Kids Celebration Doll",
      price: 1299,
      sale: 15,
      image:
        "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "d-2",
      title: "Pink Tulip Premium Stem",
      price: 899,
      image:
        "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "d-3",
      title: "Luxury Gift Box",
      price: 2199,
      image:
        "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "d-4",
      title: "Rose Basket Signature",
      price: 2499,
      image:
        "https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-14">
      <section className="overflow-x-auto rounded-xl border border-[#ef3f7a]/60 bg-linear-to-r from-[#ffe7f0] via-[#ffd8e8] to-[#ffcde1] shadow-[0_10px_30px_rgba(239,63,122,0.12)]">
        <div className="grid min-w-[920px] grid-cols-5">
          {quickFilters.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="group relative flex min-h-28 flex-col items-center justify-center gap-3 px-4 text-center transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_22px_rgba(201,74,137,0.16)]"
              >
                {index !== quickFilters.length - 1 && (
                  <span className="pointer-events-none absolute right-0 top-4 h-[calc(100%-2rem)] w-px bg-[#ef3f7a]" />
                )}
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/65 text-[#5a4763] shadow-[0_4px_10px_rgba(198,79,143,0.2)]">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-[1.75rem] text-xl font-medium text-[#2d2a47] transition group-hover:text-[#c93273]">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-[#f3ced5] bg-gradient-to-r from-[#ffeef2] via-[#ffe4ea] to-[#ffdbe4] px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <div className="pointer-events-none absolute -bottom-10 left-[-15%] h-20 w-[140%] rotate-[-8deg] rounded-full bg-[#d62f3e]/90" />
        <div className="pointer-events-none absolute -bottom-8 left-[-10%] h-12 w-[135%] rotate-[7deg] rounded-full bg-[#f35566]/85" />
        <div className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
          <span className="h-2.5 w-2.5 rounded-full bg-[#24438f]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#24438f]/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#24438f]/30" />
        </div>

        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-2">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#24438f]">Special Collection</p>
            <h1 className="text-4xl font-semibold italic leading-tight text-[#1f3f89] sm:text-5xl lg:text-6xl">
              Gift For Children
            </h1>
            <p className="max-w-md text-sm leading-7 text-[#2f3a5e]/80">
              Discover joyful gift bundles for kids, birthdays, and celebrations with colorful wrapping and same-day dispatch.
            </p>
            <Link
              href="/store?category=Birthday"
              className="inline-flex min-h-11 items-center rounded-md bg-[#24438f] px-6 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Shop Now
            </Link>
          </div>

          <div className="relative h-[230px] overflow-hidden rounded-2xl border border-white/70 bg-white/40 sm:h-[280px] lg:h-[340px]">
            <Image
              src="https://images.unsplash.com/photo-1513885535751-8b9238bd345a?q=80&w=1400&auto=format&fit=crop"
              alt="Gift box collection"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PromoCard
          title="Special Gifts For Child"
          subtitle="Create magical moments with curated kid-friendly boxes"
          href="/store?category=Birthday"
          image="https://images.unsplash.com/photo-1602631985686-1bb0e6a8696e?q=80&w=1200&auto=format&fit=crop"
        />
        <PromoCard
          title="50% Off Summer Edit"
          subtitle="Limited premium offers on seasonal gifting combos"
          href="/store?sort=price-asc"
          image="https://images.unsplash.com/photo-1481391319762-47dff72954d9?q=80&w=1200&auto=format&fit=crop"
        />
        <PromoCard
          title="Wedding Gift Curation"
          subtitle="Elegant keepsakes and floral specials"
          href="/store?category=Wedding"
          image="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1200&auto=format&fit=crop"
        />
      </section>

      <section className="rounded-3xl border border-[#edd2d9] bg-white px-4 py-8 sm:px-6 sm:py-9">
        <div className="mx-auto max-w-fit rounded-full bg-[#f8dce2] px-8 py-2">
          <h2 className="text-center text-2xl font-bold tracking-tight text-[#24438f]">Featured Products</h2>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-muted sm:gap-4">
          <button type="button" className="rounded-full bg-[#f8dce2] px-3 py-1.5 text-[#24438f]">New</button>
          <button type="button" className="rounded-full px-3 py-1.5 transition hover:bg-[#f8dce2] hover:text-[#24438f]">Top rated</button>
          <button type="button" className="rounded-full px-3 py-1.5 transition hover:bg-[#f8dce2] hover:text-[#24438f]">Trending</button>
          <button type="button" className="rounded-full px-3 py-1.5 transition hover:bg-[#f8dce2] hover:text-[#24438f]">Best offer</button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {demoProducts.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-xl border border-[#edd2d9] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative aspect-square overflow-hidden bg-[#f8f2f4]">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition duration-500 hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                {item.sale && (
                  <span className="absolute left-2 top-2 rounded bg-[#ef476f] px-2 py-0.5 text-[10px] font-semibold text-white">
                    {item.sale}%
                  </span>
                )}
                <div className="absolute right-2 top-2 flex flex-col gap-1">
                  <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded bg-black/70 text-white">
                    <Heart className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded bg-black/70 text-white">
                    <ShoppingBag className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 p-3.5">
                <h3 className="truncate text-sm font-semibold text-[#222]">{item.title}</h3>
                <p className="text-sm font-bold text-[#24438f]">{formatCurrency(item.price)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[#f3ced5] bg-[#fff1f4] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#24438f]">Gift Tip</p>
            <h3 className="mt-1 text-2xl font-bold text-[#24438f]">Need handpicked suggestions?</h3>
            <p className="mt-2 max-w-xl text-sm text-[#3d4a70]/85">
              Tell us the age, occasion, and budget. We’ll recommend the best gift options instantly.
            </p>
          </div>
          <Link
            href="/store"
            className="inline-flex min-h-11 items-center rounded-md bg-[#24438f] px-5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Explore Collection
          </Link>
        </div>
      </section>
    </div>
  );
}

function PromoCard({
  title,
  subtitle,
  href,
  image,
}: {
  title: string;
  subtitle: string;
  href: string;
  image: string;
}) {
  return (
    <Link href={href} className="group relative overflow-hidden rounded-2xl border border-[#f3ced5] bg-[#ffe8ee] p-4 sm:p-5">
      <div className="absolute inset-0 opacity-90 transition group-hover:scale-105">
        <Image src={image} alt={title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
      </div>
      <div className="relative z-10 max-w-[78%] rounded-md bg-white/82 p-3 backdrop-blur-sm">
        <h3 className="text-base font-bold text-[#24438f]">{title}</h3>
        <p className="mt-1 text-xs text-[#2f3a5e]/80">{subtitle}</p>
        <span className="mt-3 inline-flex rounded bg-[#24438f] px-3 py-1.5 text-xs font-semibold text-white">Shop Now</span>
      </div>
    </Link>
  );
}
