"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductListItemDto, SearchMeta, SortOption } from "@/types/api";
import { LayoutGrid, List } from "lucide-react";

type ProductFilters = {
  q: string;
  category: string;
  tag: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  storeId: string;
  sort: SortOption;
  stock: boolean;
};

type Props = {
  initialItems: ProductListItemDto[];
  initialMeta: SearchMeta;
  filters: ProductFilters;
};

type ItemsApiResponse = {
  success?: boolean;
  data?: ProductListItemDto[];
  meta?: SearchMeta;
  error?: { message?: string };
};

function buildQuery(filters: ProductFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.minRating) params.set("minRating", filters.minRating);
  if (filters.storeId) params.set("storeId", filters.storeId);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.stock) params.set("stock", "1");
  params.set("page", String(page));
  params.set("pageSize", "8");
  return params;
}

export function ProductsInfiniteResults({ initialItems, initialMeta, filters }: Props) {
  const [items, setItems] = useState(initialItems);
  const [meta, setMeta] = useState(initialMeta);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const hasMore = meta.page < meta.totalPages;
  const nextPage = meta.page + 1;

  useEffect(() => {
    setItems(initialItems);
    setMeta(initialMeta);
    setIsLoadingMore(false);
    setLoadError(null);
  }, [initialItems, initialMeta]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) {
      return;
    }

    setIsLoadingMore(true);
    setLoadError(null);

    try {
      const params = buildQuery(filters, nextPage);
      const response = await fetch(`/api/items?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as ItemsApiResponse;
      if (!response.ok || !payload.success || !Array.isArray(payload.data) || !payload.meta) {
        throw new Error(payload.error?.message ?? "Unable to load more products");
      }

      setItems((previous) => {
        const existingIds = new Set(previous.map((item) => item.id));
        const incoming = payload.data?.filter((item) => !existingIds.has(item.id)) ?? [];
        return [...previous, ...incoming];
      });
      setMeta(payload.meta);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load more products");
    } finally {
      setIsLoadingMore(false);
    }
  }, [filters, hasMore, isLoadingMore, nextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loadError) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        void loadMore();
      },
      {
        rootMargin: "260px 0px",
      },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadError, loadMore]);

  const sortLabel = useMemo(() => filters.sort.replace("-", " "), [filters.sort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[1.4rem] border border-[#ead7cb] bg-white/82 px-4 py-3.5 text-slate-900 shadow-[0_20px_48px_-38px_rgba(113,52,39,0.28)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-700">Showing {items.length} of {meta.total} products</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-[#efc9ba] bg-[#fff7f1] text-slate-700">{sortLabel}</Badge>
            {filters.category ? <Badge variant="outline" className="border-[#efc9ba] bg-[#fff7f1] text-slate-700">{filters.category}</Badge> : null}
            {filters.tag ? <Badge variant="outline" className="border-[#efc9ba] bg-[#fff7f1] text-slate-700">{filters.tag}</Badge> : null}
          </div>
          
          <div className="hidden sm:flex items-center gap-1 rounded-lg border border-[#ead7cb] bg-transparent p-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-md border ${viewMode === "list" ? "border-[#cd9933] bg-[#cd9933] text-white hover:bg-[#b9882f] hover:text-white" : "border-[#e5d7cc] bg-white text-slate-900 hover:bg-white hover:text-slate-900"}`}
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-md border ${viewMode === "grid" ? "border-[#cd9933] bg-[#cd9933] text-white hover:bg-[#b9882f] hover:text-white" : "border-[#e5d7cc] bg-white text-slate-900 hover:bg-white hover:text-slate-900"}`}
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="rounded-4xl border-dashed border-[#e5c9bb] bg-white/78 text-slate-900">
          <CardContent className="p-10 text-center">
            <h2 className="font-display text-3xl font-semibold text-slate-950">No products found</h2>
            <p className="mt-2 text-sm text-slate-600">Try adjusting the filters, broadening the price range, or removing a tag.</p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/products">Reset filters</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === "grid" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" : "flex flex-col gap-4"}>
          {items.map((item) => (
            <ProductCard key={item.id} product={item} layout={viewMode} />
          ))}
        </div>
      )}

      <div className="space-y-2" aria-live="polite">
        {loadError ? (
          <div className="flex items-center justify-between rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <p>{loadError}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void loadMore()}>
              Retry
            </Button>
          </div>
        ) : null}

        {isLoadingMore ? (
          <p className="text-center text-sm text-slate-600">Loading more products...</p>
        ) : null}

        {!hasMore && items.length ? (
          <p className="text-center text-sm text-slate-500">You have reached the end of the products list.</p>
        ) : null}

        <div ref={sentinelRef} className="h-2" aria-hidden />
      </div>
    </div>
  );
}
