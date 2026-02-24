import Link from "next/link";
import { Filter } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { categories, getProducts, SortOption } from "@/lib/catalog";
import { searchItems, listStores } from "@/lib/server/ecommerce-service";

type SearchParams = {
  q?: string;
  category?: string;
  tag?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  storeId?: string;
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
  const tag = params.tag ?? "";
  const minPrice = params.minPrice ?? "";
  const maxPrice = params.maxPrice ?? "";
  const minRating = params.minRating ?? "";
  const storeId = params.storeId ?? "";
  const sort = (params.sort ?? "featured") as SortOption;
  const page = Number(params.page ?? "1");
  const inStock = params.stock === "1";

  const stores = await listStores().catch(() => []);

  const result = await searchItems({
    q: query || undefined,
    category: category || undefined,
    tag: tag || undefined,
    sort,
    page,
    pageSize: 8,
    stock: inStock || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    minRating: minRating ? Number(minRating) : undefined,
    storeId: storeId || undefined,
  }).catch(() => {
    const fallback = getProducts({
      query,
      category: category || undefined,
      sort,
      page,
      inStock,
    });

    return {
      items: fallback.items,
      meta: {
        total: fallback.total,
        totalPages: fallback.totalPages,
        page: fallback.page,
        pageSize: fallback.pageSize,
        filters: {
          q: query || undefined,
          category: category || undefined,
          tag: undefined,
          stock: inStock,
          minPrice: undefined,
          maxPrice: undefined,
          storeId: undefined,
          minRating: undefined,
          sort,
        },
      },
    };
  });

  return (
    <div className="space-y-7 sm:space-y-8">
      <header className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <Badge variant="secondary" className="mb-3">Gift collection</Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Shop our multi-vendor marketplace</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Compare offers across vendors, filter by store, and discover the best price for every gift item.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg"><Filter className="h-4 w-4" />Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-6" action="/store" method="get">
            <Input
              defaultValue={query}
              name="q"
              placeholder="Search gifts, tags, categories..."
              className="md:col-span-2"
            />

            <select name="category" defaultValue={category} className="min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select name="sort" defaultValue={sort} className="min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to high</option>
              <option value="price-desc">Price: High to low</option>
              <option value="rating">Top rated</option>
            </select>

            <select name="storeId" defaultValue={storeId} className="min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">All vendors</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>

            <Label className="flex min-h-11 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal">
              <Checkbox name="stock" value="1" defaultChecked={inStock} />
              In stock only
            </Label>

            <Input type="number" min={0} name="minPrice" defaultValue={minPrice} placeholder="Min price" />
            <Input type="number" min={0} name="maxPrice" defaultValue={maxPrice} placeholder="Max price" />
            <Input type="number" min={0} max={5} step={0.1} name="minRating" defaultValue={minRating} placeholder="Min rating" />
            <Input name="tag" defaultValue={tag} placeholder="Tag (same-day, luxury...)" className="md:col-span-2" />

            <Button className="md:col-span-6" type="submit">Apply filters</Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Showing {result.items.length} of {result.meta.total} products
        </p>
      </div>

      {result.items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <h2 className="text-lg font-semibold">No products found</h2>
            <p className="mt-2 text-sm text-muted-foreground">Try changing filters or search keyword.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/store">Reset filters</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {result.items.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      )}

      <Pagination
        current={result.meta.page}
        total={result.meta.totalPages}
        q={query}
        category={category}
        tag={tag}
        minPrice={minPrice}
        maxPrice={maxPrice}
        minRating={minRating}
        storeId={storeId}
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
  tag,
  minPrice,
  maxPrice,
  minRating,
  storeId,
  sort,
  stock,
}: {
  current: number;
  total: number;
  q: string;
  category: string;
  tag: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  storeId: string;
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
    if (tag) params.set("tag", tag);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minRating) params.set("minRating", minRating);
    if (storeId) params.set("storeId", storeId);
    if (sort) params.set("sort", sort);
    if (stock) params.set("stock", "1");
    params.set("page", String(page));
    return `/store?${params.toString()}`;
  };

  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="Pagination">
      {pages.map((page) => (
        <Button
          key={page}
          asChild
          variant={page === current ? "default" : "outline"}
          size="sm"
        >
          <Link href={buildHref(page)}>{page}</Link>
        </Button>
      ))}
    </nav>
  );
}
