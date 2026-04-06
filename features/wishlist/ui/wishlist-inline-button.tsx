"use client";

import { Heart } from "lucide-react";
import { useWishlistStore } from "@/features/wishlist/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function WishlistInlineButton({
  productId,
  iconOnly = false,
  className,
}: {
  productId: string;
  iconOnly?: boolean;
  className?: string;
}) {
  const { productIds, toggle } = useWishlistStore();
  const liked = productIds.includes(productId);

  if (iconOnly) {
    return (
      <Button
        type="button"
        onClick={() => toggle(productId)}
        variant="outline"
        size="icon"
        aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
        className={cn(
          "h-11 w-11 rounded-full border-[#ddcfc5] bg-white/95 text-[#4a3f39] shadow-[0_14px_28px_-20px_rgba(56,34,27,0.72)]",
          liked && "border-[#cd9933] bg-[#cd9933] text-white hover:bg-[#b9882f]",
          className,
        )}
      >
        <Heart className={cn("h-4.5 w-4.5", liked && "fill-current")} />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={() => toggle(productId)}
      variant={liked ? "default" : "outline"}
      className={cn(
        "w-full gap-2 sm:w-auto",
        className,
      )}
    >
      <Heart className="h-4 w-4" />
      {liked ? "In wishlist" : "Add wishlist"}
    </Button>
  );
}
