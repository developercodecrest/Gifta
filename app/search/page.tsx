import Link from "next/link";
import { Filter, Search, Sparkles, Star, Store, Truck } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { categories, getProducts, SortOption } from "@/lib/catalog";
import { listStores, searchItems } from "@/lib/server/ecommerce-service";

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

const quickFilterLinks = [
  { label: "Same day", href: "/search?tag=same-day", icon: Truck },
  { label: "Premium", href: "/search?tag=luxury", icon: Sparkles },
  { label: "Top rated", href: "/search?sort=rating", icon: Star },
  { label: "By vendor", href: "/search?q=store", icon: Store },
];

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <SearchContent searchParams={searchParams} />;
}

async function SearchContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
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
    <div className="space-y-7 sm:space-y-8 py-5 sm:py-6 lg:py-8">
      <header className="surface-mesh soft-shadow rounded-[2rem] border border-white/70 p-6 sm:p-8 lg:p-10">
        <Badge variant="secondary" className="border-0 bg-white/80 text-slate-800">Search</Badge>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Gift search with more visual polish, faster scanning, and wider product space</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground sm:text-base">
              Discover gifts, categories, and vendors with a cleaner layout, stronger filter hierarchy, and more breathing room for product cards.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickFilterLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} className="rounded-[1.3rem] border border-white/70 bg-white/85 px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5">
                  <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /> {item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <Card className="glass-panel sticky top-28 rounded-[2rem] border-white/60">
          <CardHeader className="pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Refine search</p>
            <CardTitle className="flex items-center gap-2 text-xl"><Filter className="h-4 w-4" /> Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" action="/search" method="get">
              <div className="space-y-2">
                <Label htmlFor="search-q">Search query</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="search-q" defaultValue={query} name="q" placeholder="Search gifts, vendors, occasions..." className="h-12 rounded-full pl-10" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="search-category">Category</Label>
                  <select id="search-category" name="category" defaultValue={category} className="min-h-12 w-full rounded-[1rem] border border-input bg-background/90 px-3 py-2 text-sm">
                    <option value="">All categories</option>
                    {categories.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search-sort">Sort</Label>
                  <select id="search-sort" name="sort" defaultValue={sort} className="min-h-12 w-full rounded-[1rem] border border-input bg-background/90 px-3 py-2 text-sm">
                    <option value="featured">Featured</option>
                    <option value="price-asc">Price: Low to high</option>
                    <option value="price-desc">Price: High to low</option>
                    <option value="rating">Top rated</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-store">Vendor</Label>
                <select id="search-store" name="storeId" defaultValue={storeId} className="min-h-12 w-full rounded-[1rem] border border-input bg-background/90 px-3 py-2 text-sm">
                  <option value="">All vendors</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="search-min-price">Min price</Label>
                  <Input id="search-min-price" type="number" min={0} name="minPrice" defaultValue={minPrice} placeholder="0" className="h-12 rounded-[1rem]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search-max-price">Max price</Label>
                  <Input id="search-max-price" type="number" min={0} name="maxPrice" defaultValue={maxPrice} placeholder="5000" className="h-12 rounded-[1rem]" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="search-min-rating">Min rating</Label>
                  <Input id="search-min-rating" type="number" min={0} max={5} step={0.1} name="minRating" defaultValue={minRating} placeholder="4.0" className="h-12 rounded-[1rem]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search-tag">Tag</Label>
                  <Input id="search-tag" name="tag" defaultValue={tag} placeholder="same-day, premium..." className="h-12 rounded-[1rem]" />
                </div>
              </div>

              <Label className="flex min-h-12 items-center gap-2 rounded-[1rem] border border-input bg-background/90 px-4 py-3 text-sm font-normal">
                <Checkbox name="stock" value="1" defaultChecked={inStock} />
                In stock only
              </Label>

              <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
                <Button className="h-12 sm:flex-1 xl:w-full" type="submit">Apply filters</Button>
                <Button asChild variant="outline" className="h-12 border-[#efc9ba] bg-white/80 sm:flex-1 xl:w-full">
                  <Link href="/search">Reset</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-[1.6rem] border border-white/60 bg-white/75 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Showing {result.items.length} of {result.meta.total} products</p>
              <p className="mt-1 text-xs text-muted-foreground">More horizontal space keeps cards larger and easier to compare across breakpoints.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-[#efc9ba] bg-[#fff7f1] text-slate-700">{sort.replace("-", " ")}</Badge>
              {category ? <Badge variant="outline" className="border-[#efc9ba] bg-[#fff7f1] text-slate-700">{category}</Badge> : null}
              {tag ? <Badge variant="outline" className="border-[#efc9ba] bg-[#fff7f1] text-slate-700">{tag}</Badge> : null}
            </div>
          </div>

          {result.items.length === 0 ? (
            <Card className="rounded-[2rem] border-dashed border-[#e5c9bb] bg-white/70">
              <CardContent className="p-10 text-center">
                <h2 className="font-display text-3xl font-semibold">No products found</h2>
                <p className="mt-2 text-sm text-muted-foreground">Try adjusting the filters, broadening the price range, or removing a tag.</p>
                <Button asChild variant="outline" className="mt-5 border-[#efc9ba] bg-white/85">
                  <Link href="/search">Reset filters</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
      </section>
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
    return `/search?${params.toString()}`;
  };

  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="Pagination">
      {pages.map((page) => (
        <Button
          key={page}
          asChild
          variant={page === current ? "default" : "outline"}
          size="sm"
          className={page === current ? "" : "border-[#efc9ba] bg-white/80"}
        >
          <Link href={buildHref(page)}>{page}</Link>
        </Button>
      ))}
    </nav>
  );
}
