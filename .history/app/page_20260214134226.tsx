import Link from "next/link";
import { Gift, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { getFeaturedProducts } from "@/lib/catalog";

export default function Home() {
  const featured = getFeaturedProducts(4);

  return (
    <div className="space-y-16 lg:space-y-20">
      <section className="grid gap-7 rounded-3xl border border-border bg-gradient-to-br from-surface to-background p-5 sm:gap-8 sm:p-8 lg:grid-cols-2 lg:p-12">
        <div className="space-y-7">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
            Luxury Gifting Experience
          </span>
          <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Curated premium gifts for every meaningful moment.
          </h1>
          <p className="max-w-xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
            Discover handcrafted hampers, personalized keepsakes, and celebration-ready collections with elegant packaging and fast delivery.
          </p>
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <Link href="/store" className="rounded-lg bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground transition hover:opacity-90">
              Explore Store
            </Link>
            <Link href="/store?sort=rating" className="rounded-lg border border-border bg-white px-5 py-3 text-center text-sm font-semibold transition hover:bg-surface">
              Top Rated Gifts
            </Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Feature icon={Truck} title="Express Delivery" desc="Same-day delivery available in metro cities." />
          <Feature icon={Gift} title="Elegant Wrapping" desc="Premium gift wrap and card included free." />
          <Feature icon={ShieldCheck} title="Secure Checkout" desc="Modern checkout experience ready for payment integration." />
          <Feature icon={Sparkles} title="Personalized Touch" desc="Add custom notes and curated recommendations." />
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Editor’s Picks</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Featured Gifts</h2>
          </div>
          <Link href="/store" className="text-sm font-semibold text-primary">
            View all
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Shop by Occasion</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Curated Collections</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CategoryTile title="Birthday Surprises" href="/store?category=Birthday" />
        <CategoryTile title="Anniversary Luxury" href="/store?category=Anniversary" />
        <CategoryTile title="Corporate Curation" href="/store?category=Corporate" />
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Icon className="mb-3 h-5 w-5 text-primary" />
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-muted">{desc}</p>
    </div>
  );
}

function CategoryTile({ title, href }: { title: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <p className="text-xs uppercase tracking-wider text-muted">Shop Collection</p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted">Explore curated products for this celebration.</p>
    </Link>
  );
}
