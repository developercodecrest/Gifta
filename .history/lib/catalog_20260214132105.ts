import { products } from "@/data/products";
import { Product } from "@/types/ecommerce";

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
  return products.find((item) => item.slug === slug);
}

export function getFeaturedProducts(limit = 4) {
  return products.filter((item) => item.featured).slice(0, limit);
}

export function getRelatedProducts(currentId: string, category: string, limit = 4) {
  return products
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

  let filtered = [...products];

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
