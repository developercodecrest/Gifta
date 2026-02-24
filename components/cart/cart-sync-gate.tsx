"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/features/cart/store";
import { CartItem } from "@/types/ecommerce";

const LOCAL_CART_KEY = "gifta-cart";

export function CartSyncGate() {
  const { status, data } = useSession();
  const items = useCartStore((state) => state.items);
  const setItems = useCartStore((state) => state.setItems);
  const initializedFor = useRef<string | null>(null);
  const syncTimer = useRef<number | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !data?.user?.id) {
      initializedFor.current = null;
      return;
    }

    if (initializedFor.current === data.user.id) {
      return;
    }

    initializedFor.current = data.user.id;

    fetch("/api/cart/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          success?: boolean;
          data?: { items?: CartItem[] };
        };

        if (response.ok && payload.success) {
          setItems(payload.data?.items ?? []);
          localStorage.removeItem(LOCAL_CART_KEY);
        }
      })
      .catch(() => {
        initializedFor.current = null;
      });
  }, [data?.user?.id, items, setItems, status]);

  useEffect(() => {
    if (status !== "authenticated" || !data?.user?.id) {
      return;
    }

    if (initializedFor.current !== data.user.id) {
      return;
    }

    if (syncTimer.current) {
      window.clearTimeout(syncTimer.current);
    }

    syncTimer.current = window.setTimeout(() => {
      fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }).catch(() => undefined);
    }, 300);

    return () => {
      if (syncTimer.current) {
        window.clearTimeout(syncTimer.current);
      }
    };
  }, [data?.user?.id, items, status]);

  return null;
}
