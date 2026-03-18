import Image from "next/image";
import Link from "next/link";
import { HeroSlider } from "@/components/home/hero-slider";
import { GiftCategoryHeroSection } from "@/components/home/gift-category-icons";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { getHomeData } from "@/lib/server/ecommerce-service";
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

const popularCategoryProducts: ProductListItemDto[] = [
  createDemoProduct({
    id: "demo-category-birthday-bloom-box",
    slug: "birthday-bloom-box",
    name: "Birthday Bloom Box",
    description: "Fresh florals, gourmet treats, and a bright note card packed for joyful birthday surprises.",
    price: 1299,
    originalPrice: 1599,
    rating: 4.7,
    reviews: 164,
    category: "Birthday",
    tags: ["birthday", "flowers", "same-day"],
    image: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1200&q=80",
  }),
  createDemoProduct({
    id: "demo-category-anniversary-memory-trunk",
    slug: "anniversary-memory-trunk",
    name: "Anniversary Memory Trunk",
    description: "A romantic keepsake trunk with artisan chocolates and a premium card for meaningful moments.",
    price: 1899,
    originalPrice: 2299,
    rating: 4.9,
    reviews: 208,
    category: "Anniversary",
    tags: ["anniversary", "romantic", "premium"],
    image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80",
    deliveryEtaHours: 8,
  }),
  createDemoProduct({
    id: "demo-category-wedding-blessing-hamper",
    slug: "wedding-blessing-hamper",
    name: "Wedding Blessing Hamper",
    description: "An elegant wedding hamper with celebratory sweets, decor accents, and blessing cards.",
    price: 2499,
    originalPrice: 2999,
    rating: 4.8,
    reviews: 141,
    category: "Wedding",
    tags: ["wedding", "luxury", "celebration"],
    image: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
    deliveryEtaHours: 12,
  }),
  createDemoProduct({
    id: "demo-category-festive-saffron-treasure-box",
    slug: "festive-saffron-treasure-box",
    name: "Festive Saffron Treasure Box",
    description: "A festive curation of sweets, dry fruits, and saffron-toned keepsakes for seasonal gifting.",
    price: 1799,
    originalPrice: 2199,
    rating: 4.8,
    reviews: 176,
    category: "Festive",
    tags: ["festive", "family", "premium"],
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80",
    deliveryEtaHours: 10,
  }),
  createDemoProduct({
    id: "demo-category-corporate-signature-desk-box",
    slug: "corporate-signature-desk-box",
    name: "Corporate Signature Desk Box",
    description: "A polished desk-ready gift set with premium snacks, a notebook, and executive finishing details.",
    price: 2099,
    originalPrice: 2599,
    rating: 4.7,
    reviews: 98,
    category: "Corporate",
    tags: ["corporate", "executive", "premium"],
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    deliveryEtaHours: 14,
  }),
  createDemoProduct({
    id: "demo-category-self-care-moonlight-retreat",
    slug: "self-care-moonlight-retreat",
    name: "Self Care Moonlight Retreat",
    description: "A calming self-care box with candles, tea, bath essentials, and wellness treats.",
    price: 1399,
    originalPrice: 1699,
    rating: 4.8,
    reviews: 156,
    category: "Self Care",
    tags: ["self-care", "wellness", "relaxation"],
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80",
    deliveryEtaHours: 9,
  }),
];

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

  try {
    const homeData = await getHomeData();
    featured = homeData.featured;
    arrivals = homeData.topRated;
  } catch {
    featured = [];
    arrivals = [];
  }

  const leadProducts = (featured.length ? featured : arrivals).slice(0, 8);
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

      <GiftCategoryHeroSection />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Choose by occasion</p>
            <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">Popular categories</h2>
          </div>
          <Button  variant="outline">
            <Link href="/search">Browse all categories</Link>
          </Button>
        </div>

        <div className="rounded-4xl border border-[rgba(201,160,122,0.24)] bg-[linear-gradient(180deg,rgba(255,251,246,0.98),rgba(248,238,228,0.94))] px-3 py-5 shadow-[0_28px_65px_-50px_rgba(88,52,24,0.4)] sm:px-4 lg:px-5">
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-between sm:gap-4 lg:gap-3">
            {popularCategoryProducts.map((item) => (
              <div key={item.id} className="min-w-24 shrink-0 snap-start text-center sm:min-w-0 sm:flex-1">
                <Link href={`/store/${item.slug}`} className="group flex flex-col items-center gap-2.5">
                  <span className="relative block h-22 w-22 rounded-full bg-[linear-gradient(135deg,rgba(242,213,189,0.92),rgba(255,246,238,0.98))] p-1 shadow-[0_18px_34px_-24px_rgba(78,42,26,0.45)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_24px_40px_-24px_rgba(78,42,26,0.52)] sm:h-24 sm:w-24 lg:h-28 lg:w-28">
                    <span className="relative block h-full w-full overflow-hidden rounded-full border border-white/80 bg-[#f6e6d6]">
                      <Image
                        src={item.images[0]}
                        alt={item.category}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 96px, (max-width: 1024px) 112px, 128px"
                      />
                    </span>
                  </span>

                  <p className="text-sm font-medium leading-none text-foreground transition group-hover:text-primary sm:text-[0.95rem] lg:text-base">
                    {item.category}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Trending now</p>
            <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">Bestsellers</h2>
          </div>
          <Button >
            <Link href="/search?sort=rating">See top-rated gifts</Link>
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
            <Link href="/search?sort=rating">View all</Link>
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
            <Link href="/search?tag=luxury">Explore signature gifts</Link>
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d31a6b]">Loved by customers</p>
              <h3 className="font-display mt-2 text-3xl font-semibold text-[#b31258] sm:text-4xl">Trusted by teams who gift at scale</h3>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#7f3358] sm:text-base">
                Real feedback from teams using Gifta for campaigns, milestones, and high-volume celebration moments.
              </p>
            </div>
            <span className="motion-safe:animate-rise rounded-full border border-[#ffb2d1] bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#c01763] shadow-[0_14px_28px_-22px_rgba(173,26,90,0.42)] [animation-delay:140ms] fill-mode-[both]">
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
                    <h4 className="text-base font-semibold text-[#c01763]">{item.name}</h4>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#ff2f86]">{item.title}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-8 text-[#783250]">{item.description}</p>

                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span key={`${item.id}-star-${index}`} className="text-base text-[#ff1e79]">★</span>
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d92274]">Verified</span>
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
                <Link href="/auth/sign-up">Register as a vendor</Link>
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
            <svg
              viewBox="0 0 520 360"
              role="img"
              aria-label="Vendor growth illustration"
              className="h-auto w-full drop-shadow-[0_28px_42px_rgba(0,0,0,0.24)]"
            >
              <defs>
                <linearGradient id="vendorCard" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffd8ea" />
                  <stop offset="100%" stopColor="#fff4f9" />
                </linearGradient>
                <linearGradient id="vendorAccent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff0a72" />
                  <stop offset="100%" stopColor="#e90066" />
                </linearGradient>
              </defs>

              <rect x="26" y="30" width="468" height="300" rx="36" fill="url(#vendorCard)" opacity="0.96" />
              <circle cx="110" cy="95" r="46" fill="#ffd8ea" />
              <circle cx="428" cy="92" r="34" fill="#ffc7df" opacity="0.85" />

              <rect x="90" y="116" width="340" height="180" rx="22" fill="#ffffff" />
              <rect x="112" y="138" width="102" height="102" rx="16" fill="#fff1f8" />
              <path d="M134 218 L164 176 L184 198 L206 166" stroke="#ff0066" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />

              <rect x="232" y="142" width="160" height="16" rx="8" fill="#f69ac3" />
              <rect x="232" y="170" width="136" height="14" rx="7" fill="#ffd7e9" />
              <rect x="232" y="194" width="118" height="14" rx="7" fill="#ffd7e9" />

              <rect x="232" y="226" width="140" height="40" rx="14" fill="url(#vendorAccent)" />
              <text x="302" y="251" textAnchor="middle" fill="#fff8fc" fontSize="16" fontWeight="700" fontFamily="Arial, sans-serif">
                Join Vendors
              </text>

              <path d="M128 76 C145 52 176 50 195 74" stroke="#ff0b73" strokeWidth="8" fill="none" strokeLinecap="round" />
              <path d="M362 72 C377 54 406 52 420 72" stroke="#ff0b73" strokeWidth="8" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </section>

      <section className="rounded-4xl border border-[#ffc2dd] bg-[linear-gradient(160deg,#fff7fb_0%,#ffeef6_100%)] p-6 shadow-[0_24px_56px_-38px_rgba(255,0,102,0.26)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ff0066]">Mobile app</p>
            <h3 className="font-display mt-2 text-3xl font-semibold text-[#ff0066] sm:text-4xl">Scan and download Gifta from Play Store</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#7a1f4b] sm:text-base">
              Scan this live QR code to open the Gifta app page on Play Store and access gifting, tracking, and wishlist features on mobile.
            </p>
            <div className="mt-5 inline-flex rounded-full border border-[#ff99c2] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#ff0066]">
              Android app • Live QR
            </div>
          </div>

          <div className="mx-auto rounded-3xl border border-[#ffb3d1] bg-white p-4 shadow-[0_20px_42px_-30px_rgba(255,0,102,0.36)] sm:p-5">
            <div
              role="img"
              aria-label="Live Play Store QR code"
              className="h-44 w-44 [&_svg]:h-full [&_svg]:w-full [&_svg]:rounded-xl"
              dangerouslySetInnerHTML={{ __html: playStoreQrSvg }}
            />
            <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#ff0066]">Scan for Play Store</p>
          </div>
        </div>
      </section>
    </div>
  );
}
