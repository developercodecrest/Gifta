import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { categories, getProducts, SortOption } from "@/lib/catalog";

type SearchParams = {
  q?: string;
  category?: string;
  sort?: SortOption;
  stock?: string;
  page?: string;
};

export default function StorePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <StoreContent searchParams={searchParams} />;
}

async function StoreContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = params.q ?? "";
  const category = params.category ?? "";
  const sort = (params.sort ?? "featured") as SortOption;
  const page = Number(params.page ?? "1");
  const inStock = params.stock === "1";

  const result = getProducts({
    query,
    category: category || undefined,
    sort,
    page,
    inStock,
  });

  return (
    <div className="space-y-7 sm:space-y-8">
      <header className="overflow-hidden rounded-3xl border border-[#f3ced5] bg-gradient-to-r from-[#ffeef2] via-[#ffe6ec] to-[#ffdce5] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#24438f]">Gift Collection</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#24438f] sm:text-4xl">Shop Our Premium Store</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#2f3a5e]/80 sm:text-base">
          Find the perfect premium gift with smart search, category filters, and curated trending selections.
        </p>
      </header>

      <form className="grid gap-3 rounded-2xl border border-[#f1d5db] bg-[#fff1f4] p-4 md:grid-cols-5" action="/store" method="get">
        <input
          defaultValue={query}
          name="q"
          placeholder="Search gifts, tags, categories..."
          className="min-h-11 rounded-lg border border-[#edd2d9] bg-white px-3 py-2 text-sm md:col-span-2"
        />

        <select name="category" defaultValue={category} className="min-h-11 rounded-lg border border-[#edd2d9] bg-white px-3 py-2 text-sm">
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select name="sort" defaultValue={sort} className="min-h-11 rounded-lg border border-[#edd2d9] bg-white px-3 py-2 text-sm">
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to high</option>
          <option value="price-desc">Price: High to low</option>
          <option value="rating">Top rated</option>
        </select>

        <label className="flex min-h-11 items-center gap-2 rounded-lg border border-[#edd2d9] bg-white px-3 py-2 text-sm">
          <input type="checkbox" name="stock" value="1" defaultChecked={inStock} />
          In stock only
        </label>

        <button className="min-h-11 rounded-lg bg-[#24438f] px-4 py-2 text-sm font-semibold text-white md:col-span-5" type="submit">
          Apply filters
        </button>
      </form>

      <div className="flex items-center justify-between gap-2">
        <p className="rounded-full bg-[#f8dce2] px-3 py-1 text-sm text-[#24438f]">
          Showing {result.items.length} of {result.total} products
        </p>
      </div>

      {result.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e7c7cf] bg-[#fff6f8] p-8 text-center">
          <h2 className="text-lg font-semibold">No products found</h2>
          <p className="mt-2 text-sm text-muted">Try changing filters or search keyword.</p>
          <Link href="/store" className="mt-4 inline-flex rounded-lg border border-[#e7c7cf] bg-white px-4 py-2 text-sm font-medium">
            Reset filters
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {result.items.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      )}

      <Pagination
        current={result.page}
        total={result.totalPages}
        q={query}
        category={category}
        sort={sort}
        stock={inStock}
      />
    </div>
  );
}

function Pagination({
  current,
  total,
  q,
  category,
  sort,
  stock,
}: {
  current: number;
  total: number;
  q: string;
  category: string;
  sort: string;
  stock: boolean;
}) {
  if (total <= 1) {
    return null;
  }

  const pages = Array.from({ length: total }, (_, index) => index + 1);

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (sort) params.set("sort", sort);
    if (stock) params.set("stock", "1");
    params.set("page", String(page));
    return `/store?${params.toString()}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pages.map((page) => (
        <Link
          key={page}
          href={buildHref(page)}
          className={`min-h-10 min-w-10 rounded-md px-3 py-2 text-center text-sm ${
            page === current
              ? "bg-[#24438f] text-white"
              : "border border-[#edd2d9] bg-white text-[#2f3a5e]"
          }`}
        >
          {page}
        </Link>
      ))}
    </div>
  );
}
