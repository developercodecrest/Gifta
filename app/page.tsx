import Image from "next/image";
import Link from "next/link";
import { HeroSlider } from "@/components/home/hero-slider";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { getHomeData } from "@/lib/server/ecommerce-service";
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

  return (
    <div className="space-y-8 pb-10 sm:space-y-10 sm:pb-16">
      <section className="full-bleed overflow-hidden">
        <HeroSlider />
      </section>

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

      <section className="relative overflow-hidden rounded-4xl border border-[#ffb3d1] bg-[linear-gradient(145deg,#fff5fa_0%,#ffe8f3_42%,#ffd6e8_100%)] p-5 shadow-[0_36px_74px_-48px_rgba(255,0,102,0.34)] sm:p-7 lg:p-9">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-14 h-56 w-56 rounded-full bg-[#ff66a3]/30 blur-3xl" />
          <div className="absolute -right-18 bottom-2 h-52 w-52 rounded-full bg-[#ff3385]/28 blur-3xl" />
        </div>

        <div className="relative space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ff0066]">Loved by customers</p>
              <h3 className="font-display mt-2 text-3xl font-semibold text-[#ff0066] sm:text-4xl">Testimonials that speak for Gifta</h3>
            </div>
            <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff0066] shadow-[0_12px_22px_-18px_rgba(255,0,102,0.36)]">
              4.8 / 5 average rating
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {testimonials.map((item) => (
              <article
                key={item.id}
                className="group rounded-3xl border border-white/70 bg-white/86 p-4 shadow-[0_20px_36px_-28px_rgba(255,0,102,0.32)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_44px_-28px_rgba(255,0,102,0.38)] sm:p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-2xl ring-2 ring-[#ff99c2]">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-[#ff0066]">{item.name}</h4>
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#ff0066]">{item.title}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-[#7a1f4b]">{item.description}</p>

                <div className="mt-4 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span key={`${item.id}-star-${index}`} className="text-sm text-[#ff0066]">★</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-4xl border border-[#ff80b3] bg-[linear-gradient(125deg,#ff0066_0%,#ff0066_50%,#ff0066_100%)] p-6 text-white shadow-[0_44px_80px_-50px_rgba(255,0,102,0.56)] sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(255,214,232,0.34),transparent_34%),radial-gradient(circle_at_86%_78%,rgba(255,186,219,0.24),transparent_36%)]" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
          <div className="space-y-4">
            <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
              Partner with Gifta
            </p>
            <h3 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
              Register as a vendor and grow with premium gifting demand
            </h3>
            <p className="max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
              Join our curated network and receive high-intent orders from customers looking for thoughtful, celebration-ready gifts. We handle discovery and checkout while you focus on quality.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                
                size="lg"
                className="h-12 bg-white px-7 text-[#ff0066] shadow-[0_16px_34px_-20px_rgba(12,6,9,0.65)] hover:bg-[#ffe8f3]"
              >
                <Link href="/auth/sign-up">Register as a vendor</Link>
              </Button>
              <Button
                
                size="lg"
                variant="outline"
                className="h-12 border-white/35 bg-white/8 px-6 text-white hover:bg-white/16"
              >
                <Link href="/admin/vendors">Learn more</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <svg
              viewBox="0 0 520 360"
              role="img"
              aria-label="Vendor growth illustration"
              className="h-auto w-full drop-shadow-[0_28px_42px_rgba(0,0,0,0.24)]"
            >
              <defs>
                <linearGradient id="vendorCard" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffd6e8" />
                  <stop offset="100%" stopColor="#fff1f8" />
                </linearGradient>
                <linearGradient id="vendorAccent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff0066" />
                  <stop offset="100%" stopColor="#ff0066" />
                </linearGradient>
              </defs>

              <rect x="26" y="30" width="468" height="300" rx="36" fill="url(#vendorCard)" opacity="0.95" />
              <circle cx="110" cy="95" r="46" fill="#ffd6e8" />
              <circle cx="428" cy="92" r="34" fill="#ffc2dc" opacity="0.82" />

              <rect x="90" y="116" width="340" height="180" rx="22" fill="#ffffff" />
              <rect x="112" y="138" width="102" height="102" rx="16" fill="#fff0f8" />
              <path d="M134 218 L164 176 L184 198 L206 166" stroke="#ff0066" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />

              <rect x="232" y="142" width="160" height="16" rx="8" fill="#ff9ec7" />
              <rect x="232" y="170" width="136" height="14" rx="7" fill="#ffd6e8" />
              <rect x="232" y="194" width="118" height="14" rx="7" fill="#ffd6e8" />

              <rect x="232" y="226" width="140" height="40" rx="14" fill="url(#vendorAccent)" />
              <text x="302" y="251" textAnchor="middle" fill="#fff6fb" fontSize="16" fontWeight="700" fontFamily="Arial, sans-serif">
                Join Vendors
              </text>

              <path d="M128 76 C145 52 176 50 195 74" stroke="#ff0066" strokeWidth="8" fill="none" strokeLinecap="round" />
              <path d="M362 72 C377 54 406 52 420 72" stroke="#ff0066" strokeWidth="8" fill="none" strokeLinecap="round" />
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
              This is a dummy QR preview for app promotion. Scan to open the Play Store app page and access gifting, tracking, and wishlist features on mobile.
            </p>
            <div className="mt-5 inline-flex rounded-full border border-[#ff99c2] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#ff0066]">
              Android app • Dummy QR
            </div>
          </div>

          <div className="mx-auto rounded-3xl border border-[#ffb3d1] bg-white p-4 shadow-[0_20px_42px_-30px_rgba(255,0,102,0.36)] sm:p-5">
            <svg viewBox="0 0 180 180" role="img" aria-label="Dummy Play Store QR code" className="h-44 w-44">
              <rect x="0" y="0" width="180" height="180" rx="14" fill="#ffffff" />
              <rect x="10" y="10" width="50" height="50" fill="#111111" />
              <rect x="18" y="18" width="34" height="34" fill="#ffffff" />
              <rect x="24" y="24" width="22" height="22" fill="#111111" />
              <rect x="120" y="10" width="50" height="50" fill="#111111" />
              <rect x="128" y="18" width="34" height="34" fill="#ffffff" />
              <rect x="134" y="24" width="22" height="22" fill="#111111" />
              <rect x="10" y="120" width="50" height="50" fill="#111111" />
              <rect x="18" y="128" width="34" height="34" fill="#ffffff" />
              <rect x="24" y="134" width="22" height="22" fill="#111111" />

              <rect x="74" y="16" width="10" height="10" fill="#111111" />
              <rect x="90" y="16" width="10" height="10" fill="#111111" />
              <rect x="74" y="32" width="10" height="10" fill="#111111" />
              <rect x="90" y="48" width="10" height="10" fill="#111111" />
              <rect x="74" y="64" width="10" height="10" fill="#111111" />
              <rect x="90" y="64" width="10" height="10" fill="#111111" />

              <rect x="70" y="86" width="10" height="10" fill="#111111" />
              <rect x="84" y="86" width="10" height="10" fill="#111111" />
              <rect x="98" y="86" width="10" height="10" fill="#111111" />
              <rect x="112" y="86" width="10" height="10" fill="#111111" />
              <rect x="126" y="86" width="10" height="10" fill="#111111" />

              <rect x="70" y="100" width="10" height="10" fill="#111111" />
              <rect x="98" y="100" width="10" height="10" fill="#111111" />
              <rect x="126" y="100" width="10" height="10" fill="#111111" />
              <rect x="84" y="114" width="10" height="10" fill="#111111" />
              <rect x="112" y="114" width="10" height="10" fill="#111111" />
              <rect x="70" y="128" width="10" height="10" fill="#111111" />
              <rect x="98" y="128" width="10" height="10" fill="#111111" />
              <rect x="126" y="128" width="10" height="10" fill="#111111" />
              <rect x="84" y="142" width="10" height="10" fill="#111111" />
              <rect x="112" y="142" width="10" height="10" fill="#111111" />
            </svg>
            <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#ff0066]">Scan for Play Store</p>
          </div>
        </div>
      </section>
    </div>
  );
}
