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
        "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#edd2d9] bg-white px-4 py-2.5 text-sm font-semibold text-[#2f3a5e] sm:w-auto",
        liked && "bg-[#24438f] text-white",
      )}
    >
      <Heart className="h-4 w-4" />
      {liked ? "In wishlist" : "Add wishlist"}
    </button>
  );
}
