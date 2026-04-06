"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/features/cart/store";
import { createCustomizationSignature } from "@/lib/cart-customization";
import { CartItemCustomization } from "@/types/ecommerce";
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
  customization,
  requireAuthForCustomization,
}: {
  productId: string;
  offerId?: string;
  minQty?: number;
  maxQty?: number;
  disabled?: boolean;
  variantId?: string;
  variantOptions?: Record<string, string>;
  requiresVariantSelection?: boolean;
  customization?: CartItemCustomization;
  requireAuthForCustomization?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const { items, addItem, updateQty } = useCartStore();
  const customizationSignature = createCustomizationSignature(customization);
  const existing = items.find(
    (item) =>
      item.productId === productId &&
      item.variantId === variantId &&
      (item.customizationSignature ?? "") === (customizationSignature ?? ""),
  );
  const currentQty = existing?.quantity ?? 0;
  const outOfStock = disabled || maxQty === 0 || (requiresVariantSelection && !variantId);

  if (existing) {
    return (
      <div className="inline-flex min-h-11 items-center rounded-full border border-border/70 bg-background/90 px-1 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => updateQty(productId, currentQty - 1, minQty, maxQty, variantId, customizationSignature)} disabled={currentQty <= minQty}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="px-3 text-sm">{currentQty}</span>
        <Button variant="ghost" size="icon" onClick={() => updateQty(productId, currentQty + 1, minQty, maxQty, variantId, customizationSignature)} disabled={currentQty >= maxQty}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      onClick={() => {
        if (requireAuthForCustomization && customizationSignature && status !== "authenticated") {
          router.push(`/auth/sign-in?callbackUrl=${encodeURIComponent(pathname || "/")}`);
          return;
        }
        addItem(productId, 1, offerId, minQty, maxQty, variantId, variantOptions, customization);
      }}
      disabled={outOfStock}
      className="h-11 w-full sm:w-auto"
    >
      <ShoppingBag className="h-4 w-4" />
      {requiresVariantSelection && !variantId ? "Select variant" : outOfStock ? "Out of stock" : "Add to cart"}
    </Button>
  );
}
