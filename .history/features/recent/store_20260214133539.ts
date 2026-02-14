"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type RecentStore = {
  productIds: string[];
  push: (productId: string) => void;
};

export const useRecentStore = create<RecentStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      push: (productId) => {
        const next = [productId, ...get().productIds.filter((item) => item !== productId)].slice(0, 8);
        set({ productIds: next });
      },
    }),
    { name: "gifta-recent" },
  ),
);
