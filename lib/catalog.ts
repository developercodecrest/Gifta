import { products } from "@/data/products";
import { Product } from "@/types/ecommerce";

const demoProduct: Product = {
  id: "demo-bestseller-golden-hamper",
  storeId: "demo-store-gifta",
  slug: "golden-celebration-hamper",
  name: "Golden Celebration Hamper",
  description: "A premium gifting hamper with chocolates, flowers, and a keepsake card for milestone celebrations.",
  price: 1499,
  originalPrice: 1899,
  rating: 4.8,
  reviews: 128,
  category: "Birthday",
  tags: ["premium", "same-day", "hamper"],
  images: ["https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=80"],
  inStock: true,
  minOrderQty: 1,
  maxOrderQty: 5,
  featured: true,
};

const popularCategoryDemoProducts: Product[] = [
  {
    id: "demo-category-birthday-bloom-box",
    storeId: "demo-store-gifta",
    slug: "birthday-bloom-box",
    name: "Birthday Bloom Box",
    description: "Fresh florals, gourmet treats, and a bright note card packed for joyful birthday surprises.",
    price: 1299,
    originalPrice: 1599,
    rating: 4.7,
    reviews: 164,
    category: "Birthday",
    tags: ["birthday", "flowers", "same-day"],
    images: ["https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1200&q=80"],
    inStock: true,
    minOrderQty: 1,
    maxOrderQty: 5,
    featured: true,
  },
  {
    id: "demo-category-anniversary-memory-trunk",
    storeId: "demo-store-gifta",
    slug: "anniversary-memory-trunk",
    name: "Anniversary Memory Trunk",
    description: "A romantic keepsake trunk with artisan chocolates and a premium card for meaningful moments.",
    price: 1899,
    originalPrice: 2299,
    rating: 4.9,
    reviews: 208,
    category: "Anniversary",
    tags: ["anniversary", "romantic", "premium"],
    images: ["https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80"],
    inStock: true,
    minOrderQty: 1,
    maxOrderQty: 5,
    featured: true,
  },
  {
    id: "demo-category-wedding-blessing-hamper",
    storeId: "demo-store-gifta",
    slug: "wedding-blessing-hamper",
    name: "Wedding Blessing Hamper",
    description: "An elegant wedding hamper with celebratory sweets, decor accents, and blessing cards.",
    price: 2499,
    originalPrice: 2999,
    rating: 4.8,
    reviews: 141,
    category: "Wedding",
    tags: ["wedding", "luxury", "celebration"],
    images: ["https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80"],
    inStock: true,
    minOrderQty: 1,
    maxOrderQty: 5,
    featured: true,
  },
  {
    id: "demo-category-festive-saffron-treasure-box",
    storeId: "demo-store-gifta",
    slug: "festive-saffron-treasure-box",
    name: "Festive Saffron Treasure Box",
    description: "A festive curation of sweets, dry fruits, and saffron-toned keepsakes for seasonal gifting.",
    price: 1799,
    originalPrice: 2199,
    rating: 4.8,
    reviews: 176,
    category: "Festive",
    tags: ["festive", "family", "premium"],
    images: ["https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80"],
    inStock: true,
    minOrderQty: 1,
    maxOrderQty: 5,
    featured: true,
  },
  {
    id: "demo-category-corporate-signature-desk-box",
    storeId: "demo-store-gifta",
    slug: "corporate-signature-desk-box",
    name: "Corporate Signature Desk Box",
    description: "A polished desk-ready gift set with premium snacks, a notebook, and executive finishing details.",
    price: 2099,
    originalPrice: 2599,
    rating: 4.7,
    reviews: 98,
    category: "Corporate",
    tags: ["corporate", "executive", "premium"],
    images: ["https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"],
    inStock: true,
    minOrderQty: 1,
    maxOrderQty: 5,
    featured: true,
  },
  {
    id: "demo-category-self-care-moonlight-retreat",
    storeId: "demo-store-gifta",
    slug: "self-care-moonlight-retreat",
    name: "Self Care Moonlight Retreat",
    description: "A calming self-care box with candles, tea, bath essentials, and wellness treats.",
    price: 1399,
    originalPrice: 1699,
    rating: 4.8,
    reviews: 156,
    category: "Self Care",
    tags: ["self-care", "wellness", "relaxation"],
    images: ["https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80"],
    inStock: true,
    minOrderQty: 1,
    maxOrderQty: 5,
    featured: true,
  },
];

const demoProducts = [demoProduct, ...popularCategoryDemoProducts];
const catalogProducts = demoProducts.reduce<Product[]>((allProducts, demoItem) => {
  return allProducts.some((item) => item.id === demoItem.id) ? allProducts : [...allProducts, demoItem];
}, products);

export const categories = [
  "Birthday",
  "Anniversary",
  "Wedding",
  "Corporate",
  "Self Care",
  "Festive",
] as const;

export type SortOption = "featured" | "price-asc" | "price-desc" | "rating";

export function getProductBySlug(slug: string) {
  return catalogProducts.find((item) => item.slug === slug);
}

export function getFeaturedProducts(limit = 4) {
  return catalogProducts.filter((item) => item.featured).slice(0, limit);
}

export function getRelatedProducts(currentId: string, category: string, limit = 4) {
  return catalogProducts
    .filter((item) => item.id !== currentId && item.category === category)
    .slice(0, limit);
}

export function getProducts(params: {
  query?: string;
  category?: string;
  inStock?: boolean;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}) {
  const {
    query,
    category,
    inStock,
    sort = "featured",
    page = 1,
    pageSize = 8,
  } = params;

  let filtered = [...catalogProducts];

  if (query) {
    const normalized = query.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        item.description.toLowerCase().includes(normalized) ||
        item.tags.some((tag) => tag.toLowerCase().includes(normalized)),
    );
  }

  if (category) {
    filtered = filtered.filter((item) => item.category === category);
  }

  if (inStock) {
    filtered = filtered.filter((item) => item.inStock);
  }

  const sorted = sortProducts(filtered, sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: sorted.slice(start, start + pageSize),
    total,
    totalPages,
    page: safePage,
    pageSize,
  };
}

function sortProducts(items: Product[], sort: SortOption) {
  if (sort === "price-asc") {
    return items.sort((a, b) => a.price - b.price);
  }
  if (sort === "price-desc") {
    return items.sort((a, b) => b.price - a.price);
  }
  if (sort === "rating") {
    return items.sort((a, b) => b.rating - a.rating);
  }

  return items.sort((a, b) => Number(b.featured) - Number(a.featured));
}
