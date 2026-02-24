"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getClientCartFromCookie, writeClientCartCookie } from "@/lib/cart-cookie";
import { CartItem } from "@/types/ecommerce";

type CartStore = {
  items: CartItem[];
  addItem: (productId: string, quantity?: number, offerId?: string, minQty?: number, maxQty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number, minQty?: number, maxQty?: number) => void;
  setOffer: (productId: string, offerId?: string) => void;
  hydrateFromCookie: () => void;
  setItems: (items: CartItem[]) => void;
  clear: () => void;
};

function syncClientCookie(items: CartItem[]) {
  writeClientCartCookie(items);
}

function clampQuantity(quantity: number, minQty = 1, maxQty?: number) {
  if (maxQty === 0) {
    return 0;
  }

  const safeMin = Math.max(1, Math.floor(minQty));
  const normalized = Math.max(safeMin, Math.floor(quantity));

  if (typeof maxQty === "number" && Number.isFinite(maxQty)) {
    return Math.min(normalized, Math.max(0, Math.floor(maxQty)));
  }

  return normalized;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      hydrateFromCookie: () =>
        set(() => {
          const nextItems = getClientCartFromCookie();
          return { items: nextItems };
        }),
      setItems: (items) =>
        set(() => {
          const normalized = items
            .map((entry) => ({
              productId: entry.productId,
              quantity: Math.max(1, Math.floor(entry.quantity || 1)),
              offerId: entry.offerId,
            }))
            .filter((entry) => entry.productId);
          syncClientCookie(normalized);
          return { items: normalized };
        }),
      addItem: (productId, quantity = 1, offerId, minQty = 1, maxQty) =>
        set((state) => {
          if (maxQty === 0) {
            return state;
          }

          const existing = state.items.find((item) => item.productId === productId);

          if (existing) {
            const nextItems = state.items.map((item) =>
              item.productId === productId
                ? {
                    ...item,
                    quantity: clampQuantity(item.quantity + Math.max(1, quantity), minQty, maxQty),
                    offerId: offerId ?? item.offerId,
                  }
                : item,
            );
            syncClientCookie(nextItems);
            return {
              items: nextItems.filter((entry) => entry.quantity > 0),
            };
          }

          const nextItems = [...state.items, { productId, quantity: clampQuantity(quantity, minQty, maxQty), offerId }]
            .filter((entry) => entry.quantity > 0);
          syncClientCookie(nextItems);
          return { items: nextItems };
        }),
      removeItem: (productId) =>
        set((state) => {
          const nextItems = state.items.filter((item) => item.productId !== productId);
          syncClientCookie(nextItems);
          return { items: nextItems };
        }),
      updateQty: (productId, quantity, minQty = 1, maxQty) =>
        set((state) => {
          const nextItems = state.items
            .map((item) =>
              item.productId === productId
                ? { ...item, quantity: clampQuantity(quantity, minQty, maxQty) }
                : item,
            )
            .filter((item) => item.quantity > 0);
          syncClientCookie(nextItems);
          return { items: nextItems };
        }),
      setOffer: (productId, offerId) =>
        set((state) => {
          const nextItems = state.items.map((item) =>
            item.productId === productId
              ? { ...item, offerId }
              : item,
          );
          syncClientCookie(nextItems);
          return { items: nextItems };
        }),
      clear: () => {
        syncClientCookie([]);
        set({ items: [] });
      },
    }),
    {
      name: "gifta-cart",
    },
  ),
);
