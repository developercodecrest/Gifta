"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getClientCartFromCookie, writeClientCartCookie } from "@/lib/cart-cookie";
import { CartItem } from "@/types/ecommerce";

type CartStore = {
  items: CartItem[];
  addItem: (productId: string, quantity?: number, offerId?: string, minQty?: number, maxQty?: number, variantId?: string, variantOptions?: Record<string, string>) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQty: (productId: string, quantity: number, minQty?: number, maxQty?: number, variantId?: string) => void;
  setOffer: (productId: string, offerId?: string, variantId?: string) => void;
  setVariant: (productId: string, variantId?: string, variantOptions?: Record<string, string>, currentVariantId?: string) => void;
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
              variantId: entry.variantId,
              variantOptions: entry.variantOptions,
            }))
            .filter((entry) => entry.productId);
          syncClientCookie(normalized);
          return { items: normalized };
        }),
      addItem: (productId, quantity = 1, offerId, minQty = 1, maxQty, variantId, variantOptions) =>
        set((state) => {
          if (maxQty === 0) {
            return state;
          }

          const existing = state.items.find((item) => item.productId === productId && item.variantId === variantId);

          if (existing) {
            const nextItems = state.items.map((item) =>
              item.productId === productId && item.variantId === variantId
                ? {
                    ...item,
                    quantity: clampQuantity(item.quantity + Math.max(1, quantity), minQty, maxQty),
                    offerId: offerId ?? item.offerId,
                    variantOptions: variantOptions ?? item.variantOptions,
                  }
                : item,
            );
            syncClientCookie(nextItems);
            return {
              items: nextItems.filter((entry) => entry.quantity > 0),
            };
          }

          const nextItems = [...state.items, { productId, quantity: clampQuantity(quantity, minQty, maxQty), offerId, variantId, variantOptions }]
            .filter((entry) => entry.quantity > 0);
          syncClientCookie(nextItems);
          return { items: nextItems };
        }),
      removeItem: (productId, variantId) =>
        set((state) => {
          const nextItems = state.items.filter((item) => {
            if (item.productId !== productId) {
              return true;
            }
            if (variantId === undefined) {
              return false;
            }
            return item.variantId !== variantId;
          });
          syncClientCookie(nextItems);
          return { items: nextItems };
        }),
      updateQty: (productId, quantity, minQty = 1, maxQty, variantId) =>
        set((state) => {
          const nextItems = state.items
            .map((item) =>
              item.productId === productId && (variantId === undefined || item.variantId === variantId)
                ? { ...item, quantity: clampQuantity(quantity, minQty, maxQty) }
                : item,
            )
            .filter((item) => item.quantity > 0);
          syncClientCookie(nextItems);
          return { items: nextItems };
        }),
      setOffer: (productId, offerId, variantId) =>
        set((state) => {
          const nextItems = state.items.map((item) =>
            item.productId === productId && (variantId === undefined || item.variantId === variantId)
              ? { ...item, offerId }
              : item,
          );
          syncClientCookie(nextItems);
          return { items: nextItems };
        }),
      setVariant: (productId, variantId, variantOptions, currentVariantId) =>
        set((state) => {
          const nextItems = state.items.map((item) =>
            item.productId === productId && (currentVariantId === undefined || item.variantId === currentVariantId)
              ? { ...item, variantId, variantOptions }
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
