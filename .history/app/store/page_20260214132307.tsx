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
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Gift Store</h1>
        <p className="text-muted">Find the perfect premium gift with smart search and filters.</p>
      </header>

      <form className="grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-5" action="/store" method="get">
        <input
          defaultValue={query}
          name="q"
          placeholder="Search gifts, tags, categories..."
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm md:col-span-2"
        />

        <select name="category" defaultValue={category} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select name="sort" defaultValue={sort} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to high</option>
          <option value="price-desc">Price: High to low</option>
          <option value="rating">Top rated</option>
        </select>

        <label className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm">
          <input type="checkbox" name="stock" value="1" defaultChecked={inStock} />
          In stock only
        </label>

        <button className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background md:col-span-5" type="submit">
          Apply filters
        </button>
      </form>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Showing {result.items.length} of {result.total} products</p>
      </div>

      {result.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center">
          <h2 className="text-lg font-semibold">No products found</h2>
          <p className="mt-2 text-sm text-muted">Try changing filters or search keyword.</p>
          <Link href="/store" className="mt-4 inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium">
            Reset filters
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          className={`rounded-md px-3 py-2 text-sm ${
            page === current ? "bg-primary text-primary-foreground" : "border border-border"
          }`}
        >
          {page}
        </Link>
      ))}
    </div>
  );
}
