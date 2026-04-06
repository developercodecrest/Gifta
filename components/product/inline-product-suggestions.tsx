"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ProductListItemDto } from "@/types/api";
import { Product } from "@/types/ecommerce";
import { useCartStore } from "@/features/cart/store";
import { resolveProductImage } from "@/lib/product-image";
import { formatCurrency } from "@/lib/utils";

type SuggestionItem = Product | ProductListItemDto;
const ITEMS_PER_PAGE = 3;

export function InlineProductSuggestions({ items }: { items: SuggestionItem[] }) {
  const addItem = useCartStore((state) => state.addItem);
  const [page, setPage] = useState(0);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE)), [items.length]);
  const safePage = page % pageCount;
  const startIndex = safePage * ITEMS_PER_PAGE;
  const quickItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (!quickItems.length) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-[#d5dbe5] bg-white p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[1.05rem] font-semibold tracking-tight text-[#132038]">Add on delight</h3>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((current) => (current - 1 + pageCount) % pageCount)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#2b3445] hover:bg-[#f2f5fa] disabled:opacity-40"
            disabled={pageCount <= 1}
            aria-label="Previous suggestions"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => (current + 1) % pageCount)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#2b3445] hover:bg-[#f2f5fa] disabled:opacity-40"
            disabled={pageCount <= 1}
            aria-label="Next suggestions"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {quickItems.map((item) => {
          const hasVariants = (item.attributes?.length ?? 0) > 0 && (item.variants?.length ?? 0) > 0;
          const minQty = item.minOrderQty ?? 1;
          const maxQty = item.maxOrderQty ?? 10;
          const disabled = !item.inStock || maxQty === 0;
          const offerId = "bestOffer" in item ? item.bestOffer?.id : undefined;

          return (
            <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-[#d5dbe5] bg-white px-3 py-3">
              <Link href={`/store/${item.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[#f6f8fc]">
                  <Image
                    src={resolveProductImage(item.images[0])}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#15213a]">{item.name}</p>
                  <p className="text-[1.05rem] font-semibold text-[#8799b8]">
                    {hasVariants ? `From ${formatCurrency(item.price)}` : formatCurrency(item.price)}
                  </p>
                </div>
              </Link>

              {hasVariants ? (
                <Link
                  href={`/store/${item.slug}`}
                  className="inline-flex h-10 min-w-23 items-center justify-center rounded-lg bg-[#e3000f] px-4 text-base font-semibold text-white hover:bg-[#c7000d]"
                >
                  View
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={disabled}
                  className="inline-flex h-10 min-w-23 items-center justify-center gap-1.5 rounded-lg bg-[#e3000f] px-4 text-base font-semibold text-white hover:bg-[#c7000d] disabled:cursor-not-allowed disabled:opacity-55"
                  onClick={() => addItem(item.id, minQty, offerId, minQty, maxQty)}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
