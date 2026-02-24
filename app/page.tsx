import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Cake,
  Flower2,
  Heart,
  Leaf,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getFeaturedProducts } from "@/lib/catalog";
import { getHomeData, listStores } from "@/lib/server/ecommerce-service";

const concernLinks = [
  { label: "Same Day Delivery", href: "/store?tag=same-day", icon: Truck },
  { label: "Birthday Gifts", href: "/store?category=Birthday", icon: Cake },
  { label: "Anniversary Picks", href: "/store?category=Anniversary", icon: Flower2 },
  { label: "Personalized", href: "/store?tag=personalized", icon: Sparkles },
  { label: "Best Sellers", href: "/store?sort=rating", icon: BadgeCheck },
] as const;

const storyCards = [
  {
    title: "Freshly Curated",
    desc: "Handpicked premium gifting products selected for every celebration and mood.",
    icon: Leaf,
  },
  {
    title: "Trusted Quality",
    desc: "Every listing is quality-checked and packed with safe, secure handling.",
    icon: ShieldCheck,
  },
  {
    title: "Loved by Gifters",
    desc: "Thousands of happy deliveries with thoughtful packaging and notes.",
    icon: Heart,
  },
] as const;

export default async function Home() {
  const fallback = getFeaturedProducts(4);
  let featured = fallback;
  let topVendors: Awaited<ReturnType<typeof listStores>> = [];

  try {
    const homeData = await getHomeData();
    featured = homeData.featured;
    topVendors = (await listStores()).slice(0, 3);
  } catch {
    featured = fallback;
    topVendors = [];
  }

  return (
    <div className="space-y-10 sm:space-y-12">
      <section className="grid gap-6 rounded-2xl border border-border bg-card p-5 sm:p-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <article className="space-y-4">
          <Badge variant="secondary" className="text-[11px]">Breathe life into gifting</Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Premium gifts for every celebration, curated with care.</h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Discover multi-vendor gifting collections where each seller brings unique inventory and competitive pricing.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild><Link href="/store">Shop collection</Link></Button>
            <Button asChild variant="outline"><Link href="/store?sort=price-asc">Compare vendor prices</Link></Button>
          </div>
        </article>

        <aside className="relative h-64 overflow-hidden rounded-xl border border-border sm:h-72">
          <Image
            src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1400&auto=format&fit=crop"
            alt="Curated premium gift box"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 45vw"
            priority
          />
        </aside>
      </section>

      <section aria-label="Shop by concern" className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Shop by concern</h2>
          <Separator className="flex-1" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {concernLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} className="rounded-xl border border-border bg-background p-4 transition hover:bg-accent">
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-2 text-sm font-medium">{item.label}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-4" aria-label="Featured products">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Marketplace picks</h2>
          <Button asChild variant="outline" size="sm"><Link href="/store">View all</Link></Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>

      <section className="space-y-4" aria-label="Top vendors">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Top vendors</h2>
          <Separator className="flex-1" />
        </div>
        {topVendors.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">Seed marketplace data to display live vendor rankings.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {topVendors.map((vendor) => (
              <Card key={vendor.id}>
                <CardContent className="space-y-2 p-5">
                  <p className="text-sm font-semibold">{vendor.name}</p>
                  <p className="text-xs text-muted-foreground">Rating {vendor.rating.toFixed(1)} • {vendor.active ? "Active" : "Inactive"}</p>
                  <Button asChild size="sm" variant="outline"><Link href={`/store?storeId=${vendor.id}`}>Shop this vendor</Link></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3" aria-label="Brand trust and story">
        {storyCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardContent className="space-y-3 p-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                  <Icon className="h-5 w-5 text-primary" />
                </span>
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="rounded-2xl border border-border bg-secondary/45 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gift concierge</p>
            <h3 className="mt-1 text-2xl font-bold tracking-tight">Need handpicked suggestions?</h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">Share occasion, budget, and delivery date to get fast personalized product recommendations.</p>
          </div>
          <Button asChild><Link href="/account">Talk to concierge</Link></Button>
        </div>
      </section>
    </div>
  );
}
