"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, Trash2 } from "lucide-react";
import { ProductListItemDto } from "@/types/api";
import { Product } from "@/types/ecommerce";
import { useCartStore } from "@/features/cart/store";
import { getCartLineIdentity } from "@/lib/cart-customization";
import { resolveProductImage } from "@/lib/product-image";
import { formatCurrency } from "@/lib/utils";

type SuggestionItem = Product | ProductListItemDto;
const ITEMS_PER_PAGE = 3;

export function InlineProductSuggestions({ items }: { items: SuggestionItem[] }) {
  const addItem = useCartStore((state) => state.addItem);
  const updateQty = useCartStore((state) => state.updateQty);
  const removeItem = useCartStore((state) => state.removeItem);
  const cartItems = useCartStore((state) => state.items);
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
          const lineIdentity = getCartLineIdentity({ productId: item.id, variantId: undefined, customizationSignature: undefined });
          const existing = cartItems.find((entry) => getCartLineIdentity(entry) === lineIdentity);
          const quantity = existing?.quantity ?? 0;

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
              ) : existing ? (
                <div className="flex items-center gap-2">
                  <div className="inline-flex h-10 items-center rounded-lg border border-[#d5dbe5] bg-white px-1">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#1b2538] hover:bg-[#f2f5fa]"
                      onClick={() => updateQty(item.id, quantity - 1, minQty, maxQty, undefined, undefined)}
                      disabled={quantity <= minQty}
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-6 text-center text-sm font-semibold text-[#1b2538]">{quantity}</span>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#1b2538] hover:bg-[#f2f5fa]"
                      onClick={() => updateQty(item.id, quantity + 1, minQty, maxQty, undefined, undefined)}
                      disabled={quantity >= maxQty}
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#cf3f3f] bg-[#fff2f2] text-[#cf3f3f] hover:bg-[#ffe7e7]"
                    onClick={() => removeItem(item.id, undefined, undefined)}
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
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
