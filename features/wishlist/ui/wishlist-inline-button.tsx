"use client";

import { Heart } from "lucide-react";
import { useWishlistStore } from "@/features/wishlist/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function WishlistInlineButton({ productId }: { productId: string }) {
  const { productIds, toggle } = useWishlistStore();
  const liked = productIds.includes(productId);

  return (
    <Button
      type="button"
      onClick={() => toggle(productId)}
      variant={liked ? "default" : "outline"}
      className={cn(
        "w-full gap-2 sm:w-auto",
      )}
    >
      <Heart className="h-4 w-4" />
      {liked ? "In wishlist" : "Add wishlist"}
    </Button>
  );
}
