"use client";

import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/features/cart/store";

export function AddToCartInline({
  productId,
  disabled,
}: {
  productId: string;
  disabled?: boolean;
}) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <button
      type="button"
      onClick={() => addItem(productId, 1)}
      disabled={disabled}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#24438f] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      <ShoppingBag className="h-4 w-4" />
      {disabled ? "Out of stock" : "Add to cart"}
    </button>
  );
}
