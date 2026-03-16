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
  variantId,
  variantOptions,
  requiresVariantSelection,
}: {
  productId: string;
  offerId?: string;
  minQty?: number;
  maxQty?: number;
  disabled?: boolean;
  variantId?: string;
  variantOptions?: Record<string, string>;
  requiresVariantSelection?: boolean;
}) {
  const { items, addItem, updateQty } = useCartStore();
  const existing = items.find((item) => item.productId === productId && item.variantId === variantId);
  const currentQty = existing?.quantity ?? 0;
  const outOfStock = disabled || maxQty === 0 || (requiresVariantSelection && !variantId);

  if (existing) {
    return (
      <div className="inline-flex min-h-11 items-center rounded-full border border-border/70 bg-background/90 px-1 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => updateQty(productId, currentQty - 1, minQty, maxQty, variantId)} disabled={currentQty <= minQty}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="px-3 text-sm">{currentQty}</span>
        <Button variant="ghost" size="icon" onClick={() => updateQty(productId, currentQty + 1, minQty, maxQty, variantId)} disabled={currentQty >= maxQty}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      onClick={() => addItem(productId, minQty, offerId, minQty, maxQty, variantId, variantOptions)}
      disabled={outOfStock}
      className="h-11 w-full sm:w-auto"
    >
      <ShoppingBag className="h-4 w-4" />
      {requiresVariantSelection && !variantId ? "Select variant" : outOfStock ? "Out of stock" : "Add to cart"}
    </Button>
  );
}
