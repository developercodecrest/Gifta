import Link from "next/link";
import {
  ArrowRight,
  CakeSlice,
  CalendarHeart,
  Clock3,
  Crown,
  Flame,
  Flower2,
  Gift,
  Heart,
  Home as HomeIcon,
  Leaf,
  PartyPopper,
  PackageCheck,
  ShieldCheck,
  Shield,
  Sparkles,
  Star,
  Truck,
  UserRound,
  Zap,
} from "lucide-react";
import { HeroSlider } from "@/components/home/hero-slider";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getHomeData } from "@/lib/server/ecommerce-service";
import type { ProductListItemDto } from "@/types/api";

const quickCategories = [
  { label: "Same Day", href: "/store?tag=same-day", icon: Truck },
  { label: "Cakes", href: "/store?category=Cakes", icon: CakeSlice },
  { label: "Flowers", href: "/store?category=Flowers", icon: Flower2 },
  { label: "Personalized", href: "/store?tag=personalized", icon: Gift },
  { label: "Plants", href: "/store?tag=plants", icon: Leaf },
  { label: "Birthday", href: "/store?category=Birthday", icon: CalendarHeart },
  { label: "Anniversary", href: "/store?category=Anniversary", icon: Heart },
  { label: "Premium", href: "/store?tag=luxury", icon: Crown },
  { label: "Corporate", href: "/store?q=corporate", icon: Shield },
] as const;

const storyPills = [
  { label: "Holi Edit", href: "/store?category=Festive" },
  { label: "Women’s Day", href: "/store?q=women%27s+day" },
  { label: "Luxe Picks", href: "/store?tag=luxury" },
  { label: "Fresh Cakes", href: "/store?category=Cakes" },
  { label: "Photo Gifts", href: "/store?tag=photo" },
  { label: "Drinkware", href: "/store?q=drinkware" },
  { label: "Home Decor", href: "/store?q=home+decor" },
  { label: "Love Notes", href: "/store?q=romantic" },
] as const;

const glossyBanners = [
  {
    title: "Deliver joy in 60 minutes",
    desc: "Fast slots, handpicked premium gifts, and secure delivery tracking.",
    href: "/store?tag=same-day",
    cta: "Send now",
    icon: Clock3,
  },
  {
    title: "Personalized gifting studio",
    desc: "Create memorable gifts with names, photos, notes, and custom packs.",
    href: "/store?tag=personalized",
    cta: "Customize gifts",
    icon: Sparkles,
  },
] as const;

const occasionTiles = [
  { label: "Birthdays", href: "/store?category=Birthday", icon: PartyPopper },
  { label: "Anniversaries", href: "/store?category=Anniversary", icon: Heart },
  { label: "Festivals", href: "/store?category=Festive", icon: Flame },
  { label: "Housewarming", href: "/store?q=housewarming", icon: HomeIcon },
] as const;

const collectionCards = [
  {
    title: "Express gifting lane",
    desc: "Handpicked last-minute gifts with reliable same-day delivery slots.",
    href: "/store?tag=same-day",
    cta: "Shop same day",
    icon: Zap,
  },
  {
    title: "Personalized stories",
    desc: "Custom keepsakes and engraved picks for meaningful surprises.",
    href: "/store?tag=personalized",
    cta: "Explore personalized",
    icon: Gift,
  },
  {
    title: "Festival-ready hampers",
    desc: "Seasonal packs and premium assortments made for big celebrations.",
    href: "/store?category=Festive",
    cta: "Browse festive",
    icon: Star,
  },
  {
    title: "Quality-assured picks",
    desc: "Trusted vendors, secure checkout, and transparent reviews.",
    href: "/store?sort=rating",
    cta: "Browse top rated",
    icon: Shield,
  },
] as const;

const relationshipLinks = [
  { label: "For Her", href: "/store?q=for+her" },
  { label: "For Him", href: "/store?q=for+him" },
  { label: "For Parents", href: "/store?q=parents" },
  { label: "For Friends", href: "/store?q=friends" },
  { label: "For Kids", href: "/store?q=kids" },
  { label: "For Colleagues", href: "/store?q=corporate" },
  { label: "For Couples", href: "/store?q=couple" },
  { label: "For Family", href: "/store?q=family" },
] as const;

const reviews = [
  { name: "Priya S.", text: "The personalized lamp I ordered for my parents' anniversary was absolutely beautiful. Delivered right on time!", rating: 5 },
  { name: "Rahul M.", text: "Best place for last-minute gifts. The midnight cake delivery made my wife's birthday super special.", rating: 5 },
  { name: "Anita K.", text: "Amazing quality and packaging. The hamper looked exactly like the pictures. Highly recommended!", rating: 5 },
] as const;

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

  return (
    <div className="pb-10 sm:pb-14">
      <section className="mx-auto mt-3 w-full max-w-7xl px-3 sm:mt-4 sm:px-4">
        <Card className="overflow-hidden border-primary/20 bg-linear-to-r from-primary/10 via-card to-secondary/20">
          <CardContent className="flex flex-col items-start justify-between gap-2.5 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Free shipping on select orders above ₹1199
            </div>
            <Button asChild size="sm" variant="secondary" className="w-full rounded-full sm:w-auto">
              <Link href="/store?sort=price-asc">Shop value picks</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto mt-5 w-full max-w-7xl px-3 sm:mt-6 sm:px-4">
        <Card className="overflow-hidden border-border/60 bg-card/80 shadow-sm backdrop-blur">
          <CardContent className="p-2 sm:p-3">
            <div className="flex snap-x snap-mandatory items-center justify-between gap-1 overflow-x-auto divide-x divide-border/60 scrollbar-hide">
              {quickCategories.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="group flex min-w-[90px] snap-start flex-1 flex-col items-center gap-1.5 px-2 py-2.5 text-center text-muted-foreground transition-colors hover:text-foreground sm:min-w-[92px]"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary/60 transition-colors group-hover:bg-primary/15">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-[11px] font-medium sm:text-xs">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto mt-5 w-full max-w-7xl px-3 sm:mt-6 sm:px-4">
        <div className="flex snap-x snap-mandatory items-start gap-3 overflow-x-auto pb-1 scrollbar-hide sm:justify-center sm:gap-7">
          {storyPills.map((item) => (
            <Link key={item.label} href={item.href} className="group flex min-w-[82px] snap-start flex-col items-center gap-2 text-center">
              <span className="relative inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-linear-to-br from-secondary to-card text-sm font-semibold shadow-sm transition-all group-hover:scale-[1.02] group-hover:border-primary/40 sm:h-20 sm:w-20">
                {item.label.slice(0, 2).toUpperCase()}
                <span className="absolute inset-0 bg-linear-to-b from-background/0 to-primary/10 opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
              <span className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground sm:text-sm">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-6 w-full max-w-7xl px-3 sm:mt-7 sm:px-4">
        <div className="overflow-hidden rounded-3xl border border-border/60 shadow-sm">
          <HeroSlider />
        </div>
      </section>

      <section className="mx-auto mt-5 grid w-full max-w-7xl gap-3 px-3 sm:mt-6 sm:gap-4 sm:px-4 lg:grid-cols-2">
        {glossyBanners.map((banner) => {
          const Icon = banner.icon;
          return (
            <Card key={banner.title} className="overflow-hidden border-primary/20 bg-linear-to-br from-card via-card to-primary/10">
              <CardContent className="relative p-5 sm:p-7">
                <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <h2 className="max-w-xs text-lg font-bold tracking-tight sm:text-2xl">{banner.title}</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">{banner.desc}</p>
                <Button asChild className="mt-4 w-full rounded-full sm:w-auto">
                  <Link href={banner.href}>
                    {banner.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mx-auto mt-8 w-full max-w-7xl space-y-9 px-3 sm:mt-10 sm:space-y-14 sm:px-4">
        <section aria-label="Featured products" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Trending now</p>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Bestsellers from top vendors</h2>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-none">
                <Link href="/store?sort=rating">Top rated</Link>
              </Button>
              <Button asChild size="sm" className="flex-1 sm:flex-none">
                <Link href="/store">View all</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(featured.length ? featured : arrivals).slice(0, 8).map((item) => (
              <ProductCard key={`home-${item.id}`} product={item} />
            ))}
          </div>
        </section>

        <section aria-label="Occasion gifts" className="rounded-4xl border border-border/60 bg-linear-to-r from-secondary/50 via-card to-primary/10 p-5 sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">Gifts by occasion</h3>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/store?category=Festive">See all occasions</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {occasionTiles.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group rounded-2xl border border-border/60 bg-card/90 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold sm:text-base">{item.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Find curated picks for every celebration.</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section aria-label="Curated collections" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Curated</p>
              <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">Designer-style gift collections</h3>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {collectionCards.map((collection) => {
              const Icon = collection.icon;
              return (
                <Card key={collection.title} className="overflow-hidden border-border/60 bg-card/80 backdrop-blur">
                  <CardHeader className="space-y-2 pb-2">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <CardTitle className="text-lg">{collection.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{collection.desc}</p>
                    <Button asChild variant="outline" className="w-full justify-between rounded-full">
                      <Link href={collection.href}>
                        {collection.cta}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="rounded-4xl border border-border/60 bg-card/70 p-5 sm:p-8" aria-label="Gift by relationship">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">Shop by relationship</h3>
            <Button asChild variant="link" size="sm">
              <Link href="/store">Browse complete catalog</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {relationshipLinks.map((item) => (
              <Button key={item.label} asChild variant="secondary" className="h-11 justify-between rounded-xl px-4 sm:h-12">
                <Link href={item.href}>
                  <span>{item.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ))}
          </div>
        </section>

        <section className="space-y-5" aria-label="Top rated products">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">Top rated this week</h3>
            <Button asChild variant="outline" size="sm">
              <Link href="/store?sort=rating">See all</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(arrivals.length ? arrivals : featured).slice(0, 4).map((item) => (
              <ProductCard key={`rating-${item.id}`} product={item} />
            ))}
          </div>
        </section>

        <section className="rounded-4xl border border-border/60 bg-linear-to-r from-primary/10 via-card to-secondary/30 p-6 sm:p-9" aria-label="Customer reviews">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Social proof</p>
              <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">Loved by thousands of gifters</h3>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.map((review) => (
              <Card key={review.name} className="border-border/60 bg-card/90">
                <CardContent className="space-y-3 p-5">
                  <div className="flex gap-1 text-primary">
                    {[...Array(review.rating)].map((_, index) => (
                      <Star key={`${review.name}-${index}`} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">“{review.text}”</p>
                  <p className="text-sm font-semibold">{review.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border/60 bg-card p-5 sm:p-8 shadow-sm" aria-label="Trust markers">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-background p-4 text-center">
              <PackageCheck className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-semibold">Trusted vendors</p>
            </div>
            <div className="rounded-xl bg-background p-4 text-center">
              <Truck className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-semibold">Same-day options</p>
            </div>
            <div className="rounded-xl bg-background p-4 text-center">
              <ShieldCheck className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-semibold">Secure checkout</p>
            </div>
            <div className="rounded-xl bg-background p-4 text-center">
              <UserRound className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-semibold">Real-time support</p>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}
