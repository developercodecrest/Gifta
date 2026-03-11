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
  { label: "Personalized", href: "/search?tag=personalized", icon: Sparkles },
  { label: "Birthday", href: "/search?category=Birthday", icon: Star },
  { label: "Anniversary", href: "/search?category=Anniversary", icon: Store },
  { label: "Premium", href: "/search?tag=luxury", icon: Sparkles },
];

const heroThemes = {
  default: {
    badge: "Search",
    title: "Gift search with stronger contrast, faster scanning, and clearer category focus",
    description: "Discover gifts, categories, and vendors with a cleaner layout, visible filter hierarchy, and a brighter product-first canvas.",
    panelClass: "border-[#edd3c5] bg-[radial-gradient(circle_at_top_left,rgba(255,183,145,0.38),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,224,196,0.9),transparent_22%),linear-gradient(135deg,#fff4eb_0%,#fffaf6_52%,#ffeede_100%)]",
    badgeClass: "border border-white/80 bg-white/85 text-slate-900",
    accentClass: "border-[#efc9ba] bg-white/90 text-slate-700",
    summary: "All gifts",
  },
  "tag:same-day": {
    badge: "Same day",
    title: "Same-day gifting with faster delivery cues and clearer product scanning",
    description: "Urgent celebration picks deserve stronger contrast, visible badges, and quick delivery context without washed-out text.",
    panelClass: "border-[#f0ceb8] bg-[radial-gradient(circle_at_top_left,rgba(255,176,118,0.5),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(255,231,194,0.94),transparent_24%),linear-gradient(135deg,#fff0df_0%,#fff8f0_54%,#ffe6cf_100%)]",
    badgeClass: "border border-[#f2c7aa] bg-[#fff7ef] text-[#7d3b19]",
    accentClass: "border-[#f2c7aa] bg-[#fff7ef] text-[#7d3b19]",
    summary: "Same-day lane",
  },
  "tag:personalized": {
    badge: "Personalized",
    title: "Personalized gift search with clearer storytelling and cleaner focus",
    description: "Custom keepsakes, photo gifts, and made-for-them pieces now land on a warmer surface with readable contrast.",
    panelClass: "border-[#ddcdee] bg-[radial-gradient(circle_at_top_left,rgba(206,187,255,0.5),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(244,235,255,0.96),transparent_26%),linear-gradient(135deg,#f6efff_0%,#fcf9ff_52%,#eee3ff_100%)]",
    badgeClass: "border border-[#d8c6ef] bg-white/86 text-[#5f3d8f]",
    accentClass: "border-[#d8c6ef] bg-white/92 text-[#5f3d8f]",
    summary: "Personalized lane",
  },
  "category:Birthday": {
    badge: "Birthday",
    title: "Birthday gifting with brighter cards, stronger hierarchy, and better visibility",
    description: "Cake-ready bundles, flowers, and cheerful picks should feel celebratory without sacrificing readability.",
    panelClass: "border-[#efcabd] bg-[radial-gradient(circle_at_top_left,rgba(255,168,136,0.44),transparent_32%),radial-gradient(circle_at_92%_10%,rgba(255,225,207,0.96),transparent_24%),linear-gradient(135deg,#fff0e6_0%,#fff8f4_56%,#ffe5d8_100%)]",
    badgeClass: "border border-[#efcabd] bg-[#fff8f3] text-[#8b4026]",
    accentClass: "border-[#efcabd] bg-[#fff8f3] text-[#8b4026]",
    summary: "Birthday lane",
  },
  "category:Anniversary": {
    badge: "Anniversary",
    title: "Anniversary gifting with softer romance tones and readable product emphasis",
    description: "Romantic florals, keepsakes, and premium pairings now sit on a warmer canvas with visible text and clearer filters.",
    panelClass: "border-[#ebcad5] bg-[radial-gradient(circle_at_top_left,rgba(255,176,195,0.4),transparent_30%),radial-gradient(circle_at_90%_8%,rgba(255,240,244,0.98),transparent_22%),linear-gradient(135deg,#fff1f4_0%,#fff9fb_54%,#ffe5ec_100%)]",
    badgeClass: "border border-[#ebcad5] bg-white/88 text-[#8c3652]",
    accentClass: "border-[#ebcad5] bg-white/92 text-[#8c3652]",
    summary: "Anniversary lane",
  },
  "tag:luxury": {
    badge: "Premium",
    title: "Premium gifting with richer contrast, polished chips, and a stronger editorial feel",
    description: "Luxury hampers, signature assortments, and high-intent gifting deserve a more refined and visible search surface.",
    panelClass: "border-[#ead5b6] bg-[radial-gradient(circle_at_top_left,rgba(255,211,134,0.46),transparent_30%),radial-gradient(circle_at_92%_8%,rgba(255,245,223,0.98),transparent_24%),linear-gradient(135deg,#fff4e2_0%,#fffaf2_54%,#ffe8c9_100%)]",
    badgeClass: "border border-[#e5cb9f] bg-[#fff9ee] text-[#7a5521]",
    accentClass: "border-[#e5cb9f] bg-[#fff9ee] text-[#7a5521]",
    summary: "Premium lane",
  },
} as const;

function getHeroTheme(tag: string, category: string) {
  if (tag === "same-day") return heroThemes["tag:same-day"];
  if (tag === "personalized") return heroThemes["tag:personalized"];
  if (tag === "luxury") return heroThemes["tag:luxury"];
  if (category === "Birthday") return heroThemes["category:Birthday"];
  if (category === "Anniversary") return heroThemes["category:Anniversary"];
  return heroThemes.default;
}

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
  const heroTheme = getHeroTheme(tag, category);

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
      <header className={`soft-shadow rounded-[2rem] border p-6 text-slate-950 sm:p-8 lg:p-10 ${heroTheme.panelClass}`}>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className={heroTheme.badgeClass}>{heroTheme.badge}</Badge>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase ${heroTheme.accentClass}`}>{heroTheme.summary}</span>
        </div>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display max-w-5xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              {heroTheme.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-700 sm:text-base">
              {heroTheme.description}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {quickFilterLinks.map((item) => {
              const Icon = item.icon;
              const isActive = item.href.includes("tag=")
                ? item.href.includes(`tag=${tag}`)
                : item.href.includes(`category=${category}`);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={[
                    "rounded-[1.3rem] border px-4 py-3 text-sm font-medium text-slate-900 transition duration-200 hover:-translate-y-0.5",
                    isActive
                      ? "border-slate-900/10 bg-slate-900 text-white shadow-[0_18px_36px_-24px_rgba(15,23,42,0.55)]"
                      : "border-white/70 bg-white/88 shadow-[0_18px_32px_-28px_rgba(113,52,39,0.32)] hover:bg-white",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2">
                    <Icon className={isActive ? "h-4 w-4 text-white" : "h-4 w-4 text-primary"} />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <Card className="sticky top-28 rounded-[2rem] border-[#ead7cb] bg-white/88 text-slate-900 shadow-[0_24px_52px_-40px_rgba(113,52,39,0.28)] backdrop-blur">
          <CardHeader className="pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Refine search</p>
            <CardTitle className="flex items-center gap-2 text-xl text-slate-950"><Filter className="h-4 w-4" /> Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" action="/search" method="get">
              <div className="space-y-2">
                <Label htmlFor="search-q" className="text-slate-800">Search query</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="search-q" defaultValue={query} name="q" placeholder="Search gifts, vendors, occasions..." className="h-12 rounded-full border-[#dbc6b9] bg-white text-slate-900 placeholder:text-slate-400 pl-10" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="search-category" className="text-slate-800">Category</Label>
                  <select id="search-category" name="category" defaultValue={category} className="min-h-12 w-full rounded-[1rem] border border-[#dbc6b9] bg-white px-3 py-2 text-sm text-slate-900">
                    <option value="">All categories</option>
                    {categories.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search-sort" className="text-slate-800">Sort</Label>
                  <select id="search-sort" name="sort" defaultValue={sort} className="min-h-12 w-full rounded-[1rem] border border-[#dbc6b9] bg-white px-3 py-2 text-sm text-slate-900">
                    <option value="featured">Featured</option>
                    <option value="price-asc">Price: Low to high</option>
                    <option value="price-desc">Price: High to low</option>
                    <option value="rating">Top rated</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-store" className="text-slate-800">Vendor</Label>
                <select id="search-store" name="storeId" defaultValue={storeId} className="min-h-12 w-full rounded-[1rem] border border-[#dbc6b9] bg-white px-3 py-2 text-sm text-slate-900">
                  <option value="">All vendors</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="search-min-price" className="text-slate-800">Min price</Label>
                  <Input id="search-min-price" type="number" min={0} name="minPrice" defaultValue={minPrice} placeholder="0" className="h-12 rounded-[1rem] border-[#dbc6b9] bg-white text-slate-900 placeholder:text-slate-400" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search-max-price" className="text-slate-800">Max price</Label>
                  <Input id="search-max-price" type="number" min={0} name="maxPrice" defaultValue={maxPrice} placeholder="5000" className="h-12 rounded-[1rem] border-[#dbc6b9] bg-white text-slate-900 placeholder:text-slate-400" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="search-min-rating" className="text-slate-800">Min rating</Label>
                  <Input id="search-min-rating" type="number" min={0} max={5} step={0.1} name="minRating" defaultValue={minRating} placeholder="4.0" className="h-12 rounded-[1rem] border-[#dbc6b9] bg-white text-slate-900 placeholder:text-slate-400" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search-tag" className="text-slate-800">Tag</Label>
                  <Input id="search-tag" name="tag" defaultValue={tag} placeholder="same-day, premium..." className="h-12 rounded-[1rem] border-[#dbc6b9] bg-white text-slate-900 placeholder:text-slate-400" />
                </div>
              </div>

              <Label className="flex min-h-12 items-center gap-2 rounded-[1rem] border border-[#dbc6b9] bg-white px-4 py-3 text-sm font-normal text-slate-800">
                <Checkbox name="stock" value="1" defaultChecked={inStock} />
                In stock only
              </Label>

              <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
                <Button className="h-12 sm:flex-1 xl:w-full" type="submit">Apply filters</Button>
                <Button asChild variant="outline" className="h-12 sm:flex-1 xl:w-full">
                  <Link href="/search">Reset</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-[1.6rem] border border-[#ead7cb] bg-white/82 px-5 py-4 text-slate-900 shadow-[0_20px_48px_-38px_rgba(113,52,39,0.28)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">Showing {result.items.length} of {result.meta.total} products</p>
              <p className="mt-1 text-xs text-slate-500">More horizontal space keeps cards larger and easier to compare across breakpoints.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-[#efc9ba] bg-[#fff7f1] text-slate-700">{sort.replace("-", " ")}</Badge>
              {category ? <Badge variant="outline" className="border-[#efc9ba] bg-[#fff7f1] text-slate-700">{category}</Badge> : null}
              {tag ? <Badge variant="outline" className="border-[#efc9ba] bg-[#fff7f1] text-slate-700">{tag}</Badge> : null}
            </div>
          </div>

          {result.items.length === 0 ? (
            <Card className="rounded-[2rem] border-dashed border-[#e5c9bb] bg-white/78 text-slate-900">
              <CardContent className="p-10 text-center">
                <h2 className="font-display text-3xl font-semibold text-slate-950">No products found</h2>
                <p className="mt-2 text-sm text-slate-600">Try adjusting the filters, broadening the price range, or removing a tag.</p>
                <Button asChild variant="outline" className="mt-5">
                  <Link href="/search">Reset filters</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
          className={page === current ? "" : ""}
        >
          <Link href={buildHref(page)}>{page}</Link>
        </Button>
      ))}
    </nav>
  );
}
