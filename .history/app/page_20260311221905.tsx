import Link from "next/link";
import {
  ArrowRight,
  CalendarHeart,
  Clock3,
  Gem,
  Gift,
  Heart,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  WandSparkles,
} from "lucide-react";
import { HeroSlider } from "@/components/home/hero-slider";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getHomeData } from "@/lib/server/ecommerce-service";
import type { ProductListItemDto } from "@/types/api";

const quickCategories = [
  { label: "Same Day", href: "/search?tag=same-day", icon: Truck, tone: "from-[#fff1dc] via-[#fff7f1] to-[#ffe3d2]" },
  { label: "Birthday", href: "/search?category=Birthday", icon: CalendarHeart, tone: "from-[#ffe2d7] via-[#fff4ec] to-[#ffd6c5]" },
  { label: "Anniversary", href: "/search?category=Anniversary", icon: Heart, tone: "from-[#ffe0eb] via-[#fff6f9] to-[#ffd8df]" },
  { label: "Personalized", href: "/search?tag=personalized", icon: WandSparkles, tone: "from-[#f2ebff] via-[#fbf8ff] to-[#ece2ff]" },
  { label: "Luxury", href: "/search?tag=luxury", icon: Gem, tone: "from-[#fff0d9] via-[#fff9ef] to-[#ffe3b8]" },
  { label: "Hampers", href: "/search?q=hamper", icon: Gift, tone: "from-[#dff8f1] via-[#f4fdfa] to-[#d7f1ea]" },
] as const;

const spotlightCards = [
  {
    title: "60-minute gifting lane",
    desc: "Quick dispatch, prominent value communication, and premium presentation for urgent celebrations.",
    href: "/search?tag=same-day",
    icon: Clock3,
  },
  {
    title: "Personalized story studio",
    desc: "Photo gifts, custom keepsakes, engraved ideas, and relationship-led gifting stories.",
    href: "/search?tag=personalized",
    icon: Sparkles,
  },
  {
    title: "Premium curated collections",
    desc: "High-intent discovery inspired by the strongest gifting storefronts and editorial layouts.",
    href: "/search?tag=luxury",
    icon: Gem,
  },
] as const;

const occasionTiles = [
  { label: "Birthdays", href: "/search?category=Birthday", icon: PartyPopper },
  { label: "Anniversaries", href: "/search?category=Anniversary", icon: Heart },
  { label: "Same-day", href: "/search?tag=same-day", icon: Truck },
  { label: "Premium", href: "/search?tag=luxury", icon: Gem },
] as const;

const collectionCards = [
  {
    title: "Express gifting lane",
    desc: "Handpicked last-minute gifts with strong visual hierarchy and reliable delivery cues.",
    href: "/search?tag=same-day",
    cta: "Shop same day",
    icon: Truck,
  },
  {
    title: "Personalized stories",
    desc: "Custom keepsakes, photo memories, and handcrafted gifts for more emotional moments.",
    href: "/search?tag=personalized",
    cta: "Explore personalized",
    icon: Gift,
  },
  {
    title: "Premium hamper stories",
    desc: "Seasonal packs and premium assortments designed with a richer editorial feel.",
    href: "/search?q=hamper",
    cta: "Browse hampers",
    icon: Star,
  },
  {
    title: "Quality-assured picks",
    desc: "Trusted vendors, secure checkout, and reviews surfaced as confidence builders.",
    href: "/search?sort=rating",
    cta: "Browse top rated",
    icon: ShieldCheck,
  },
] as const;

const relationshipLinks = [
  { label: "For Her", href: "/search?q=for+her" },
  { label: "For Him", href: "/search?q=for+him" },
  { label: "For Parents", href: "/search?q=parents" },
  { label: "For Friends", href: "/search?q=friends" },
  { label: "For Kids", href: "/search?q=kids" },
  { label: "For Colleagues", href: "/search?q=corporate" },
  { label: "For Couples", href: "/search?q=couple" },
  { label: "For Family", href: "/search?q=family" },
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

  const leadProducts = (featured.length ? featured : arrivals).slice(0, 8);
  const ratedProducts = (arrivals.length ? arrivals : featured).slice(0, 4);

  return (
    <div className="space-y-8 pb-10 sm:space-y-10 sm:pb-16">
      <section className="full-bleed overflow-hidden">
        <HeroSlider />
      </section>

      <section className="space-y-4">
        <SectionBanner eyebrow="Gift lanes" title="Browse by mood, moment, and gifting speed" description="Each home section now gets a cleaner horizontal ribbon instead of heavy framed blocks." />
        <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <Card className="surface-mesh overflow-hidden rounded-4xl border border-black/5 subtle-shadow">
          <CardContent className="p-5 sm:p-7 lg:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Curated discovery</p>
                <h2 className="font-display mt-3 text-3xl font-semibold leading-tight sm:text-4xl">A cleaner first section with broader categories and no screenshot-style design block</h2>
              </div>
              <Button asChild>
                <Link href="/search">
                  Explore full catalog
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {quickCategories.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`group rounded-3xl bg-linear-to-br ${item.tone} p-4 shadow-[0_16px_28px_-24px_rgba(113,52,39,0.18)] transition duration-300 hover:-translate-y-1`}
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/88 text-slate-800 shadow-[0_12px_22px_-18px_rgba(44,23,16,0.24)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-4 text-base font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-600">Browse expanded collections with a cleaner, more product-first layout.</p>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
            {spotlightCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.title} href={card.href} className="glass-panel rounded-[1.7rem] border border-black/5 p-5 shadow-[0_18px_34px_-28px_rgba(67,34,29,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_-32px_rgba(67,34,29,0.26)]">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff2e6] text-slate-800">
                    <Icon className="h-5 w-5 text-primary" />
                  </span>
                  <p className="mt-4 text-lg font-semibold">{card.title}</p>
                  <p className="mt-2 text-sm text-[#5f5047]">{card.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionBanner eyebrow="Trending now" title="Bestsellers with more breathing room" description="The section ribbon separates collections cleanly without turning the entire page into one long banner." />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">Expanded bestsellers with more room for the products to breathe</h2>
          </div>
          <Button asChild>
            <Link href="/search?sort=rating">See top-rated gifts</Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {leadProducts.map((item) => (
            <ProductCard key={`home-${item.id}`} product={item} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="lg:col-span-2">
          <SectionBanner eyebrow="Occasions" title="Category-led sections now have their own horizontal header" description="This keeps the home page structured while leaving the hero banner untouched." />
        </div>
        <Card className="overflow-hidden rounded-4xl border border-black/5 bg-[linear-gradient(135deg,#fff2e4_0%,#fffaf5_50%,#ffe6d4_100%)] subtle-shadow">
          <CardContent className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Occasion-led discovery</p>
            <h3 className="font-display mt-3 text-3xl font-semibold leading-tight">A more visual category system with stronger gifting intent</h3>
            <p className="mt-3 max-w-xl text-sm text-[#5f5047] sm:text-base">
              The redesigned homepage uses broader cards, richer gradients, and cleaner grouping so customers reach the right gifting lane faster.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {occasionTiles.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.label} href={item.href} className="app-data-panel rounded-3xl p-4 transition duration-300 hover:-translate-y-1">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff1e6] text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-base font-semibold">{item.label}</p>
                    <p className="mt-1 text-sm text-[#5f5047]">Thoughtful edits for key celebration moments.</p>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {collectionCards.map((collection) => {
            const Icon = collection.icon;
            return (
              <Card key={collection.title} className="glass-panel flex h-full overflow-hidden rounded-[1.8rem] border border-black/5 shadow-[0_16px_30px_-26px_rgba(113,52,39,0.18)]">
                <CardHeader className="space-y-3 pb-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff2e6] text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <CardTitle className="text-xl">{collection.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-4">
                  <p className="text-sm text-[#5f5047]">{collection.desc}</p>
                  <Button asChild className="mt-auto">
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

      <section className="space-y-4">
        <SectionBanner eyebrow="Recipients" title="Every relationship block now reads like its own guided lane" description="The ribbon treatment keeps each grouping distinct without heavy outlines." />
        <div className="rounded-4xl border border-black/5 bg-white/78 p-5 subtle-shadow sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display mt-2 text-3xl font-semibold">Clear pathways for every recipient</h3>
          </div>
          <Button asChild>
            <Link href="/search">Browse all gifts</Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {relationshipLinks.map((item) => (
            <Link key={item.label} href={item.href} className="flex items-center justify-between rounded-3xl bg-background/88 px-4 py-3.5 text-sm font-medium shadow-[0_12px_24px_-22px_rgba(113,52,39,0.14)] transition hover:-translate-y-0.5 hover:bg-[#fff6f0]">
              <span>{item.label}</span>
              <ArrowRight className="h-4 w-4 text-primary" />
            </Link>
          ))}
        </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="lg:col-span-2">
          <SectionBanner eyebrow="Customer trust" title="Social proof and confidence blocks with a cleaner professional finish" description="Heavy dark framing is removed here in favor of lighter review and assurance surfaces." />
        </div>
        <Card className="surface-mesh overflow-hidden rounded-4xl border border-black/5 subtle-shadow">
          <CardContent className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Why customers stay confident</p>
            <h3 className="font-display mt-3 text-3xl font-semibold leading-tight">The home page now feels more polished, easier to scan, and less visually boxed in</h3>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <FeatureBullet label="Cleaner merchandising" text="Less border weight and softer section separation." />
              <FeatureBullet label="Better rhythm" text="Each home section starts with its own horizontal ribbon." />
              <FeatureBullet label="Stronger trust" text="Confidence cues sit beside products without overpowering them." />
            </div>
          </CardContent>
        </Card>

        <Card className="surface-mesh overflow-hidden rounded-4xl border border-black/5 subtle-shadow">
          <CardContent className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Customer love</p>
            <h3 className="font-display mt-3 text-3xl font-semibold">Social proof with a warmer, more premium feel</h3>
            <div className="mt-6 grid gap-3">
              {reviews.map((review) => (
                <div key={review.name} className="rounded-3xl bg-white/84 p-4 shadow-[0_16px_30px_-26px_rgba(113,52,39,0.18)]">
                  <div className="flex gap-1 text-primary">
                    {[...Array(review.rating)].map((_, index) => (
                      <Star key={`${review.name}-${index}`} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-[#5f5047]">“{review.text}”</p>
                  <p className="mt-3 text-sm font-semibold">{review.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <SectionBanner eyebrow="Top rated" title="High-converting picks with a softer section frame" description="The same horizontal section treatment carries through to the final product grid." />
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display mt-2 text-3xl font-semibold">Products with strong reviews and stronger presentation</h3>
          </div>
          <Button asChild>
            <Link href="/search?sort=rating">View all</Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ratedProducts.map((item) => (
            <ProductCard key={`rating-${item.id}`} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
}

function FeatureBullet({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-white/84 p-4 shadow-[0_16px_30px_-26px_rgba(113,52,39,0.18)]">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#fff1e6] text-primary">
        <Sparkles className="h-4 w-4" />
      </span>
      <p className="mt-3 text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-sm text-[#5f5047]">{text}</p>
    </div>
  );
}

function SectionBanner({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="section-banner rounded-3xl px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
          <h2 className="font-display mt-1 text-2xl font-semibold leading-tight text-slate-900 sm:text-[2rem]">{title}</h2>
        </div>
        <p className="max-w-xl text-sm text-[#6f5a55]">{description}</p>
      </div>
    </div>
  );
}
