"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getClientCartFromCookie, writeClientCartCookie } from "@/lib/cart-cookie";
import { getCartLineIdentity, normalizeCartLine, resolveCustomizationSignature } from "@/lib/cart-customization";
import { CartItem, CartItemCustomization } from "@/types/ecommerce";

type CartStore = {
  items: CartItem[];
  addItem: (
    productId: string,
    quantity?: number,
    offerId?: string,
    minQty?: number,
    maxQty?: number,
    variantId?: string,
    variantOptions?: Record<string, string>,
    customization?: CartItemCustomization,
  ) => void;
  removeItem: (productId: string, variantId?: string, customizationSignature?: string) => void;
  updateQty: (productId: string, quantity: number, minQty?: number, maxQty?: number, variantId?: string, customizationSignature?: string) => void;
  setOffer: (productId: string, offerId?: string, variantId?: string, customizationSignature?: string) => void;
  setVariant: (productId: string, variantId?: string, variantOptions?: Record<string, string>, currentVariantId?: string, customizationSignature?: string) => void;
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

function collapseByIdentity(items: CartItem[]) {
  const normalized = items
    .map((entry) => normalizeCartLine(entry))
    .filter((entry): entry is CartItem => Boolean(entry));

  const map = new Map<string, CartItem>();
  for (const item of normalized) {
    const key = getCartLineIdentity(item);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, item);
      continue;
    }

    map.set(key, {
      ...existing,
      quantity: existing.quantity + item.quantity,
      offerId: item.offerId ?? existing.offerId,
      variantOptions: item.variantOptions ?? existing.variantOptions,
    });
  }

  return Array.from(map.values());
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
          const normalized = collapseByIdentity(items);
          syncClientCookie(normalized);
          return { items: normalized };
        }),
      addItem: (productId, quantity = 1, offerId, minQty = 1, maxQty, variantId, variantOptions, customization) =>
        set((state) => {
          if (maxQty === 0) {
            return state;
          }

          const normalizedCustomization = resolveCustomizationSignature({ customization });
          const targetKey = getCartLineIdentity({
            productId,
            variantId,
            customization: normalizedCustomization.customization,
            customizationSignature: normalizedCustomization.customizationSignature,
          });

          const existing = state.items.find((item) => getCartLineIdentity(item) === targetKey);

          if (existing) {
            const nextItems = state.items.map((item) =>
              getCartLineIdentity(item) === targetKey
                ? {
                    ...item,
                    quantity: clampQuantity(item.quantity + Math.max(1, quantity), minQty, maxQty),
                    offerId: offerId ?? item.offerId,
                    variantOptions: variantOptions ?? item.variantOptions,
                    customization: normalizedCustomization.customization ?? item.customization,
                    customizationSignature: normalizedCustomization.customizationSignature ?? item.customizationSignature,
                  }
                : item,
            );
            syncClientCookie(nextItems);
            return {
              items: nextItems.filter((entry) => entry.quantity > 0),
            };
          }

          const nextItems = collapseByIdentity([
            ...state.items,
            {
              productId,
              quantity: clampQuantity(quantity, minQty, maxQty),
              offerId,
              variantId,
              variantOptions,
              customization: normalizedCustomization.customization,
              customizationSignature: normalizedCustomization.customizationSignature,
            },
          ]).filter((entry) => entry.quantity > 0);
          syncClientCookie(nextItems);
          return { items: nextItems };
        }),
      removeItem: (productId, variantId, customizationSignature) =>
        set((state) => {
          const normalizedSignature = customizationSignature?.trim();
          const nextItems = state.items.filter((item) => {
            if (item.productId !== productId) {
              return true;
            }

            if (variantId === undefined && !normalizedSignature) {
              return false;
            }

            if (variantId !== undefined && item.variantId !== variantId) {
              return true;
            }

            if (normalizedSignature && item.customizationSignature !== normalizedSignature) {
              return true;
            }

            return false;
          });
          syncClientCookie(nextItems);
          return { items: nextItems };
        }),
      updateQty: (productId, quantity, minQty = 1, maxQty, variantId, customizationSignature) =>
        set((state) => {
          const normalizedSignature = customizationSignature?.trim();
          const nextItems = state.items
            .map((item) =>
              item.productId === productId &&
              (variantId === undefined || item.variantId === variantId) &&
              (!normalizedSignature || item.customizationSignature === normalizedSignature)
                ? { ...item, quantity: clampQuantity(quantity, minQty, maxQty) }
                : item,
            )
            .filter((item) => item.quantity > 0);
          syncClientCookie(nextItems);
          return { items: nextItems };
        }),
      setOffer: (productId, offerId, variantId, customizationSignature) =>
        set((state) => {
          const normalizedSignature = customizationSignature?.trim();
          const nextItems = state.items.map((item) =>
            item.productId === productId &&
            (variantId === undefined || item.variantId === variantId) &&
            (!normalizedSignature || item.customizationSignature === normalizedSignature)
              ? { ...item, offerId }
              : item,
          );
          syncClientCookie(nextItems);
          return { items: nextItems };
        }),
      setVariant: (productId, variantId, variantOptions, currentVariantId, customizationSignature) =>
        set((state) => {
          const normalizedSignature = customizationSignature?.trim();
          const nextItems = collapseByIdentity(
            state.items.map((item) =>
              item.productId === productId &&
              (currentVariantId === undefined || item.variantId === currentVariantId) &&
              (!normalizedSignature || item.customizationSignature === normalizedSignature)
                ? { ...item, variantId, variantOptions }
                : item,
            ),
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
