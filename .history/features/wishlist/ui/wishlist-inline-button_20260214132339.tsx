"use client";

import { Heart } from "lucide-react";
import { useWishlistStore } from "@/features/wishlist/store";
import { cn } from "@/lib/utils";

export function WishlistInlineButton({ productId }: { productId: string }) {
  const { productIds, toggle } = useWishlistStore();
  const liked = productIds.includes(productId);

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold",
        liked && "bg-foreground text-background",
      )}
    >
      <Heart className="h-4 w-4" />
      {liked ? "In wishlist" : "Add wishlist"}
    </button>
  );
}
