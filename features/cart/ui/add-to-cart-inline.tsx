"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/features/cart/store";
import { Button } from "@/components/ui/button";

export function AddToCartInline({
  productId,
  offerId,
  minQty = 1,
  maxQty = 10,
  disabled,
}: {
  productId: string;
  offerId?: string;
  minQty?: number;
  maxQty?: number;
  disabled?: boolean;
}) {
  const { items, addItem, updateQty } = useCartStore();
  const existing = items.find((item) => item.productId === productId);
  const currentQty = existing?.quantity ?? 0;
  const outOfStock = disabled || maxQty === 0;

  if (existing) {
    return (
      <div className="inline-flex min-h-10 items-center rounded-md border border-border bg-card">
        <Button variant="ghost" size="icon" onClick={() => updateQty(productId, currentQty - 1, minQty, maxQty)} disabled={currentQty <= minQty}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="px-3 text-sm">{currentQty}</span>
        <Button variant="ghost" size="icon" onClick={() => updateQty(productId, currentQty + 1, minQty, maxQty)} disabled={currentQty >= maxQty}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      onClick={() => addItem(productId, minQty, offerId, minQty, maxQty)}
      disabled={outOfStock}
      className="w-full sm:w-auto"
    >
      <ShoppingBag className="h-4 w-4" />
      {outOfStock ? "Out of stock" : "Add to cart"}
    </Button>
  );
}
