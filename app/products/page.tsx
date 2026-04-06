import Link from "next/link";
import { Filter, Search } from "lucide-react";
import { ProductsInfiniteResults } from "@/app/products/products-infinite-results";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getProducts, SortOption } from "@/lib/catalog";
import { getGlobalCategoryOptions, listStores, searchItems } from "@/lib/server/ecommerce-service";
import { ProductListItemDto, SearchMeta } from "@/types/api";

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

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <ProductsContent searchParams={searchParams} />;
}

async function ProductsContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
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

  const [stores, globalCategoryOptions] = await Promise.all([
    listStores().catch(() => []),
    getGlobalCategoryOptions().catch(() => []),
  ]);

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
      items: fallback.items as ProductListItemDto[],
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
      } satisfies SearchMeta,
    };
  });

  const categoryOptions = Array.from(
    new Set(
      globalCategoryOptions
        .flatMap((entry) => [entry.name, ...entry.subcategories])
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));

  const fallbackCategoryOptions = Array.from(
    new Set(result.items.map((item) => item.category).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));

  const filterCategoryOptions = categoryOptions.length ? categoryOptions : fallbackCategoryOptions;

  return (
    <div className="space-y-4 sm:space-y-5 py-3 sm:py-4 lg:py-5">

      <section className="grid gap-3 xl:grid-cols-[300px_minmax(0,1fr)] xl:items-start">
        <Card className="sticky top-24 rounded-3xl border-[#e8d9cf] bg-white/95 text-slate-900 shadow-[0_16px_34px_-28px_rgba(113,52,39,0.28)] backdrop-blur">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-slate-950"><Filter className="h-4 w-4" /> Filters</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form className="grid gap-2.5" action="/products" method="get">
              <div className="space-y-1.5">
                <Label htmlFor="products-q" className="text-slate-800">Search query</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="products-q" defaultValue={query} name="q" placeholder="Search gifts, vendors, occasions..." className="h-10 rounded-full border-[#dbc6b9] bg-white text-slate-900 placeholder:text-slate-400 pl-10" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-1.5">
                  <Label htmlFor="products-category" className="text-slate-800">Category</Label>
                  <select id="products-category" name="category" defaultValue={category} className="min-h-10 w-full rounded-xl border border-[#dbc6b9] bg-white px-3 py-2 text-sm text-slate-900">
                    <option value="">All categories</option>
                    {filterCategoryOptions.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="products-sort" className="text-slate-800">Sort</Label>
                  <select id="products-sort" name="sort" defaultValue={sort} className="min-h-10 w-full rounded-xl border border-[#dbc6b9] bg-white px-3 py-2 text-sm text-slate-900">
                    <option value="featured">Featured</option>
                    <option value="price-asc">Price: Low to high</option>
                    <option value="price-desc">Price: High to low</option>
                    <option value="rating">Top rated</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="products-store" className="text-slate-800">Vendor</Label>
                <select id="products-store" name="storeId" defaultValue={storeId} className="min-h-10 w-full rounded-xl border border-[#dbc6b9] bg-white px-3 py-2 text-sm text-slate-900">
                  <option value="">All vendors</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-1.5">
                  <Label htmlFor="products-min-price" className="text-slate-800">Min price</Label>
                  <Input id="products-min-price" type="number" min={0} name="minPrice" defaultValue={minPrice} placeholder="0" className="h-10 rounded-xl border-[#dbc6b9] bg-white text-slate-900 placeholder:text-slate-400" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="products-max-price" className="text-slate-800">Max price</Label>
                  <Input id="products-max-price" type="number" min={0} name="maxPrice" defaultValue={maxPrice} placeholder="5000" className="h-10 rounded-xl border-[#dbc6b9] bg-white text-slate-900 placeholder:text-slate-400" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-1.5">
                  <Label htmlFor="products-min-rating" className="text-slate-800">Min rating</Label>
                  <Input id="products-min-rating" type="number" min={0} max={5} step={0.1} name="minRating" defaultValue={minRating} placeholder="4.0" className="h-10 rounded-xl border-[#dbc6b9] bg-white text-slate-900 placeholder:text-slate-400" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="products-tag" className="text-slate-800">Tag</Label>
                  <Input id="products-tag" name="tag" defaultValue={tag} placeholder="same-day, premium..." className="h-10 rounded-xl border-[#dbc6b9] bg-white text-slate-900 placeholder:text-slate-400" />
                </div>
              </div>

              <Label className="flex min-h-10 items-center gap-2 rounded-xl border border-[#dbc6b9] bg-white px-3 py-2.5 text-sm font-normal text-slate-800">
                <Checkbox name="stock" value="1" defaultChecked={inStock} />
                In stock only
              </Label>

              <div className="flex flex-col gap-2.5 sm:flex-row xl:flex-col">
                <Button className="h-10 py-2 sm:flex-1 xl:w-full" type="submit">Apply filters</Button>
                <Button asChild variant="outline" className="h-10 py-2 sm:flex-1 xl:w-full">
                  <Link href="/products">Reset</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <ProductsInfiniteResults
          initialItems={result.items}
          initialMeta={result.meta}
          filters={{
            q: query,
            category,
            tag,
            minPrice,
            maxPrice,
            minRating,
            storeId,
            sort,
            stock: inStock,
          }}
        />
      </section>
    </div>
  );
}
