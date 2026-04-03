import Image from "next/image";
import Link from "next/link";
import { HeroSlider } from "@/components/home/hero-slider";
import { GiftCategoryHeroSection, type HomeCategoryTile } from "@/components/home/gift-category-icons";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { getGlobalCategoryOptions, getHomeData } from "@/lib/server/ecommerce-service";
import { Play } from "lucide-react";
import QRCode from "qrcode";
import type { ProductListItemDto } from "@/types/api";

function createDemoProduct(input: {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  category: ProductListItemDto["category"];
  tags: string[];
  image: string;
  deliveryEtaHours?: number;
}) : ProductListItemDto {
  return {
    id: input.id,
    storeId: "demo-store-gifta",
    slug: input.slug,
    name: input.name,
    description: input.description,
    price: input.price,
    originalPrice: input.originalPrice,
    rating: input.rating,
    reviews: input.reviews,
    category: input.category,
    tags: input.tags,
    images: [input.image],
    inStock: true,
    minOrderQty: 1,
    maxOrderQty: 5,
    featured: true,
    offerCount: 1,
    bestOffer: {
      id: `offer-${input.id}`,
      productId: input.id,
      storeId: "demo-store-gifta",
      price: input.price,
      originalPrice: input.originalPrice,
      inStock: true,
      deliveryEtaHours: input.deliveryEtaHours ?? 6,
      store: {
        id: "demo-store-gifta",
        name: "Gifta Studio",
        slug: "gifta-studio",
        rating: 4.8,
        active: true,
      },
    },
  };
}

const demoBestSeller = createDemoProduct({
  id: "demo-bestseller-golden-hamper",
  slug: "golden-celebration-hamper",
  name: "Golden Celebration Hamper",
  description: "A premium gifting hamper with chocolates, flowers, and a keepsake card for milestone celebrations.",
  price: 1499,
  originalPrice: 1899,
  rating: 4.8,
  reviews: 128,
  category: "Birthday",
  tags: ["premium", "same-day", "hamper"],
  image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=80",
});

const testimonials = [
  {
    id: "testimonial-1",
    name: "Aarohi Sharma",
    title: "Creative Director, Bloom & Co.",
    description:
      "Gifta completely changed how we manage festive gifting for our team. The quality is consistently premium and delivery updates are always transparent.",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "testimonial-2",
    name: "Rohan Verma",
    title: "Founder, Lakeview Events",
    description:
      "Our client delight score improved after switching to Gifta. The curation feels handcrafted, and their support team responds faster than any platform we used before.",
    image:
      "https://images.unsplash.com/photo-1542204625-de293a2c3f6b?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "testimonial-3",
    name: "Neha Iyer",
    title: "People Ops Lead, Quantify Labs",
    description:
      "From onboarding hampers to milestone surprises, everything looks elevated and thoughtful. Gifta makes large gifting workflows feel effortless.",
    image:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=80",
  },
];

const giftingPrograms = [
  {
    id: "program-1",
    title: "Concierge Curation",
    description: "Get expert gift recommendations for birthdays, anniversaries, and corporate milestones in minutes.",
  },
  {
    id: "program-2",
    title: "Same-Day Partner Network",
    description: "Our trusted city-wide vendors ensure fresh packaging and celebration-ready delivery on urgent timelines.",
  },
  {
    id: "program-3",
    title: "Premium Packaging Studio",
    description: "Elegant wrapping, hand-tied notes, and brand-ready inserts designed to make every unboxing memorable.",
  },
];

export default async function Home() {
  let featured: ProductListItemDto[] = [];
  let arrivals: ProductListItemDto[] = [];

  const [homeData, globalCategoryOptions] = await Promise.all([
    getHomeData().catch(() => null),
    getGlobalCategoryOptions().catch(() => []),
  ]);

  if (homeData) {
    featured = homeData.featured;
    arrivals = homeData.topRated;
  }

  const leadProducts = (featured.length ? featured : arrivals).slice(0, 8);
  const categoryImageFallbackByName = new Map<string, string>();
  const categoryNameByKey = new Map<string, string>();
  for (const item of [...featured, ...arrivals]) {
    const categoryName = item.category.trim().toLowerCase();
    const image = item.images[0]?.trim();
    if (!categoryName) {
      continue;
    }

    if (!categoryNameByKey.has(categoryName)) {
      categoryNameByKey.set(categoryName, item.category.trim());
    }

    if (!image || categoryImageFallbackByName.has(categoryName)) {
      continue;
    }

    categoryImageFallbackByName.set(categoryName, image);
  }

  const productCategoryKeys = new Set(categoryNameByKey.keys());
  const categoryTilesByKey = new Map<string, HomeCategoryTile>();
  const categoryCandidates = globalCategoryOptions
    .map((entry) => ({
      name: entry.name.trim(),
      image: entry.image?.trim() || "",
    }))
    .filter((entry) => productCategoryKeys.has(entry.name.toLowerCase()));

  // If category settings are empty, fall back to categories already present in DB products.
  if (!categoryCandidates.length) {
    for (const [key, name] of categoryNameByKey.entries()) {
      categoryCandidates.push({
        name,
        image: categoryImageFallbackByName.get(key) || "",
      });
    }
  }

  for (const category of categoryCandidates) {
    const name = category.name.trim();
    if (!name) {
      continue;
    }

    const key = name.toLowerCase();
    const fallbackImage = categoryImageFallbackByName.get(key);
    const image = category.image || fallbackImage;
    const existing = categoryTilesByKey.get(key);

    if (!existing) {
      categoryTilesByKey.set(key, {
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || key,
        name,
        href: `/products?category=${encodeURIComponent(name)}`,
        ...(image ? { image } : {}),
      });
      continue;
    }

    if (!existing.image && image) {
      existing.image = image;
    }
  }

  const homepageCategories = Array.from(categoryTilesByKey.values());
  const bestSellerProducts = leadProducts.some((item) => item.id === demoBestSeller.id)
    ? leadProducts
    : [...leadProducts, demoBestSeller];
  const ratedProducts = (arrivals.length ? arrivals : featured).slice(0, 4);
  const editorPicks = [...bestSellerProducts, ...ratedProducts].slice(0, 5);
  const playStoreUrl = "https://play.google.com/store/apps/details?id=com.gifta.app";
  const playStoreQrSvg = await QRCode.toString(playStoreUrl, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 1,
    width: 220,
    color: {
      dark: "#111111",
      light: "#ffffff",
    },
  });

  return (
    <div className="space-y-8 pb-10 sm:space-y-10 sm:pb-16">
      <section className="full-bleed overflow-hidden">
        <HeroSlider />
      </section>

      <GiftCategoryHeroSection categories={homepageCategories} />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Trending now</p>
            <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">Bestsellers</h2>
          </div>
          <Button >
            <Link href="/products?sort=rating">See top-rated gifts</Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {bestSellerProducts.map((item) => (
            <ProductCard key={`home-${item.id}`} product={item} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Top rated</p>
            <h3 className="font-display mt-2 text-3xl font-semibold">Best reviewed gifts</h3>
          </div>
          <Button >
            <Link href="/products?sort=rating">View all</Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {ratedProducts.map((item) => (
            <ProductCard key={`rating-${item.id}`} product={item} />
          ))}
        </div>
      </section>

      <section className="space-y-5 rounded-4xl border border-[#ffb8d4] bg-[linear-gradient(150deg,#fff6fb_0%,#ffe9f4_52%,#ffe0ee_100%)] p-5 shadow-[0_30px_64px_-42px_rgba(255,0,102,0.3)] sm:p-7 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ff0066]">Editor&apos;s curation</p>
            <h3 className="font-display mt-2 text-3xl font-semibold text-[#ff0066] sm:text-4xl">Signature picks this week</h3>
          </div>
          <Button  variant="outline" className="border-[#ff80b3] text-[#ff0066] hover:bg-[#fff0f7]">
            <Link href="/products?tag=luxury">Explore signature gifts</Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {editorPicks.map((item) => (
            <ProductCard key={`editor-${item.id}`} product={item} />
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-4xl border border-[#ffb3d1] bg-[linear-gradient(120deg,#ff0066_0%,#ff1a75_65%,#ff3385_100%)] p-6 text-white shadow-[0_38px_72px_-46px_rgba(255,0,102,0.55)] sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(255,227,239,0.26),transparent_35%),radial-gradient(circle_at_90%_90%,rgba(255,200,224,0.18),transparent_42%)]" />

        <div className="relative grid gap-4 lg:grid-cols-3">
          {giftingPrograms.map((program) => (
            <article
              key={program.id}
              className="rounded-3xl border border-white/30 bg-white/12 p-4 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:bg-white/16 sm:p-5"
            >
              <h3 className="text-lg font-semibold">{program.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/88">{program.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-4xl border border-[#f2c7db] bg-[linear-gradient(145deg,#fff9fc_0%,#fff1f7_48%,#ffe6f1_100%)] p-5 shadow-[0_34px_74px_-54px_rgba(152,39,92,0.36)] sm:p-7 lg:p-9">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#ff8db9]/20 blur-3xl" />
          <div className="absolute -right-14 bottom-1 h-56 w-56 rounded-full bg-[#ff63a1]/18 blur-3xl" />
        </div>

        <div className="relative space-y-6">
          <div className="motion-safe:animate-rise flex flex-wrap items-end justify-between gap-4">
            <div className="[animation-delay:60ms] fill-mode-[both]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#000]">Loved by customers</p>
              <h3 className="font-display mt-2 text-3xl font-semibold text-[#000] sm:text-4xl">Trusted by teams who gift at scale</h3>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#000] sm:text-base">
                Real feedback from teams using Gifta for campaigns, milestones, and high-volume celebration moments.
              </p>
            </div>
            <span className="motion-safe:animate-rise rounded-full border border-[#ffb2d1] bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#000] shadow-[0_14px_28px_-22px_rgba(173,26,90,0.42)] [animation-delay:140ms] fill-mode-[both]">
              4.8 / 5 average rating
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {testimonials.map((item, cardIndex) => (
              <article
                key={item.id}
                className="motion-safe:animate-rise group rounded-3xl border border-[#f5d5e4] bg-white/94 p-5 shadow-[0_18px_36px_-28px_rgba(140,24,74,0.42)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_48px_-30px_rgba(140,24,74,0.5)] fill-mode-[both]"
                style={{ animationDelay: `${220 + cardIndex * 120}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-[#ff9ec7] bg-[#fff2f8]">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-[#000]">{item.name}</h4>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#000]">{item.title}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-8 text-[#000]">{item.description}</p>

                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span key={`${item.id}-star-${index}`} className="text-base text-[#000]">★</span>
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#000]">Verified</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-4xl border border-[#ff8dbe] bg-[linear-gradient(128deg,#ff0f73_0%,#ff056e_55%,#ef005f_100%)] p-6 text-white shadow-[0_46px_86px_-50px_rgba(136,16,73,0.68)] sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_20%,rgba(255,225,237,0.25),transparent_35%),radial-gradient(circle_at_90%_78%,rgba(255,196,223,0.22),transparent_40%)]" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:items-center">
          <div className="motion-safe:animate-rise space-y-4 [animation-delay:80ms] fill-mode-[both]">
            <p className="inline-flex rounded-full border border-white/30 bg-white/12 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              Partner with Gifta
            </p>
            <h3 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-[2.6rem]">
              Join our vendor network and unlock premium demand
            </h3>
            <p className="max-w-2xl text-sm leading-7 text-white/90 sm:text-base">
              Work with a high-intent audience shopping for curated gifts. We bring visibility, trusted checkout, and repeat order flow so your team can focus on product quality.
            </p>

            <div className="grid gap-3 pt-1 sm:grid-cols-3 sm:gap-2 lg:max-w-xl">
              <div className="motion-safe:animate-rise rounded-2xl border border-white/25 bg-white/10 px-4 py-3 [animation-delay:180ms] fill-mode-[both]">
                <p className="text-lg font-semibold">2.8x</p>
                <p className="text-xs uppercase tracking-[0.12em] text-white/80">Lead quality uplift</p>
              </div>
              <div className="motion-safe:animate-rise rounded-2xl border border-white/25 bg-white/10 px-4 py-3 [animation-delay:260ms] fill-mode-[both]">
                <p className="text-lg font-semibold">24h</p>
                <p className="text-xs uppercase tracking-[0.12em] text-white/80">Faster onboarding</p>
              </div>
              <div className="motion-safe:animate-rise rounded-2xl border border-white/25 bg-white/10 px-4 py-3 [animation-delay:340ms] fill-mode-[both]">
                <p className="text-lg font-semibold">Top cities</p>
                <p className="text-xs uppercase tracking-[0.12em] text-white/80">Ready to scale</p>
              </div>
            </div>

            <div className="motion-safe:animate-rise flex flex-wrap items-center gap-3 pt-2 [animation-delay:420ms] fill-mode-[both]">
              <Button
                size="lg"
                className="h-12 bg-white px-7 text-[#e80067] shadow-[0_16px_34px_-20px_rgba(20,8,14,0.58)] hover:bg-[#ffe8f3]"
              >
                <Link href="/vendor-onboarding">Register as a vendor</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/40 bg-white/10 px-6 text-white hover:bg-white/18"
              >
                <Link href="/admin/vendors">Learn more</Link>
              </Button>
            </div>
          </div>

          <div className="motion-safe:animate-rise relative mx-auto w-full max-w-md [animation-delay:200ms] fill-mode-[both]">
            <Image
              src="/image1.png"
              alt="Gifta vendor storefront illustration"
              width={864}
              height={768}
              className="h-auto w-full drop-shadow-[0_28px_42px_rgba(0,0,0,0.24)] rounded-xl"
              priority
            />
          </div>
        </div>
      </section>

      <section className="rounded-4xl border border-[#ffc2dd] bg-[linear-gradient(160deg,#fff7fb_0%,#ffeef6_100%)] p-6 shadow-[0_24px_56px_-38px_rgba(255,0,102,0.26)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#000]">Mobile app</p>
            <h3 className="font-display mt-2 text-3xl font-semibold text-[#000] sm:text-4xl">Scan and download Gifta from Play Store</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#000] sm:text-base">
              Scan this live QR code to open the Gifta app page on Play Store and access gifting, tracking, and wishlist features on mobile.
            </p>
            <div className="mt-5 inline-flex rounded-full border border-[#ff99c2] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#000]">
              Android app • Live QR
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-md items-center justify-center gap-3 sm:gap-4">
            <div className="flex h-44 w-44 shrink-0 flex-col items-center justify-center rounded-3xl border border-[#ffb3d1] bg-white p-4 shadow-[0_20px_42px_-30px_rgba(255,0,102,0.36)]">
              <div className="flex h-36 w-36 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#fff7fb_0%,#ffe8f4_100%)]">
                <Play
                  role="img"
                  aria-label="Play Store icon"
                  className="h-24 w-24 fill-[#ff0066] text-[#ff0066]"
                  strokeWidth={1.6}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-[#ffb3d1] bg-white p-4 shadow-[0_20px_42px_-30px_rgba(255,0,102,0.36)] sm:p-5">
              <div
                role="img"
                aria-label="Live Play Store QR code"
                className="h-44 w-44 [&_svg]:h-full [&_svg]:w-full [&_svg]:rounded-xl"
                dangerouslySetInnerHTML={{ __html: playStoreQrSvg }}
              />
              <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#000]">Scan for Play Store</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
