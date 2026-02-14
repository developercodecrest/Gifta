"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistStore = {
  productIds: string[];
  toggle: (productId: string) => void;
  clear: () => void;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) => {
        const has = get().productIds.includes(productId);
        set({
          productIds: has
            ? get().productIds.filter((item) => item !== productId)
            : [...get().productIds, productId],
        });
      },
      clear: () => set({ productIds: [] }),
    }),
    {
      name: "gifta-wishlist",
    },
  ),
);
