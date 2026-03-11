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
          <Button asChild variant="outline">
            <Link href="/search">Browse all categories</Link>
          </Button>
        </div>

        <div className="rounded-[2rem] border border-[rgba(201,160,122,0.24)] bg-[linear-gradient(180deg,rgba(255,251,246,0.98),rgba(248,238,228,0.94))] px-3 py-5 shadow-[0_28px_65px_-50px_rgba(88,52,24,0.4)] sm:px-4 lg:px-5">
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-between sm:gap-4 lg:gap-3">
            {popularCategoryProducts.map((item) => (
              <div key={item.id} className="min-w-[96px] shrink-0 snap-start text-center sm:min-w-0 sm:flex-1">
                <Link href={`/store/${item.slug}`} className="group flex flex-col items-center gap-2.5">
                  <span className="relative block h-22 w-22 rounded-full bg-[linear-gradient(135deg,rgba(242,213,189,0.92),rgba(255,246,238,0.98))] p-[4px] shadow-[0_18px_34px_-24px_rgba(78,42,26,0.45)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_24px_40px_-24px_rgba(78,42,26,0.52)] sm:h-24 sm:w-24 lg:h-28 lg:w-28">
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
          <Button asChild>
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
          <Button asChild>
            <Link href="/search?sort=rating">View all</Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {ratedProducts.map((item) => (
            <ProductCard key={`rating-${item.id}`} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
