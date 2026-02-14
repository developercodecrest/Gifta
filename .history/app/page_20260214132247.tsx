import Link from "next/link";
import { Gift, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { getFeaturedProducts } from "@/lib/catalog";

export default function Home() {
  const featured = getFeaturedProducts(4);

  return (
    <div className="space-y-12">
      <section className="grid gap-8 rounded-3xl border border-border bg-gradient-to-br from-surface to-background p-8 lg:grid-cols-2 lg:p-12">
        <div className="space-y-6">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
            Luxury Gifting Experience
          </span>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Curated premium gifts for every meaningful moment.
          </h1>
          <p className="max-w-xl text-muted">
            Discover handcrafted hampers, personalized keepsakes, and celebration-ready collections with elegant packaging and fast delivery.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/store" className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
              Explore Store
            </Link>
            <Link href="/store?sort=rating" className="rounded-lg border border-border px-5 py-3 text-sm font-semibold">
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

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Featured Gifts</h2>
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CategoryTile title="Birthday Surprises" href="/store?category=Birthday" />
        <CategoryTile title="Anniversary Luxury" href="/store?category=Anniversary" />
        <CategoryTile title="Corporate Curation" href="/store?category=Corporate" />
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
    <div className="rounded-xl border border-border bg-white p-4">
      <Icon className="mb-3 h-5 w-5 text-primary" />
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted">{desc}</p>
    </div>
  );
}

function CategoryTile({ title, href }: { title: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-border bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-sm">
      <p className="text-xs uppercase tracking-wider text-muted">Shop Collection</p>
      <h3 className="mt-2 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted">Explore curated products for this celebration.</p>
    </Link>
  );
}
