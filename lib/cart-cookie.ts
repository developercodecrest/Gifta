import { CartItem } from "@/types/ecommerce";

export const CART_COOKIE_NAME = "gifta-cart";
const MAX_COOKIE_AGE_SECONDS = 60 * 60 * 24 * 30;

export function parseCartCookie(value?: string): CartItem[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const mapped: Array<CartItem | null> = parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const candidate = entry as Partial<CartItem>;
        if (typeof candidate.productId !== "string") {
          return null;
        }

        const quantity =
          typeof candidate.quantity === "number" && Number.isFinite(candidate.quantity)
            ? Math.max(1, Math.floor(candidate.quantity))
            : 1;

        return {
          productId: candidate.productId,
          quantity,
          offerId: typeof candidate.offerId === "string" ? candidate.offerId : undefined,
        };
      });

    return mapped.filter((entry): entry is CartItem => entry !== null);
  } catch {
    return [];
  }
}

export function serializeCartCookie(items: CartItem[]): string {
  const normalized = items
    .map((entry) => ({
      productId: entry.productId,
      quantity: Math.max(1, Math.floor(entry.quantity)),
      ...(entry.offerId ? { offerId: entry.offerId } : {}),
    }))
    .slice(0, 50);

  return JSON.stringify(normalized);
}

export function getClientCartFromCookie(): CartItem[] {
  if (typeof document === "undefined") {
    return [];
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${CART_COOKIE_NAME}=`));

  if (!cookie) {
    return [];
  }

  const rawValue = cookie.slice(CART_COOKIE_NAME.length + 1);
  return parseCartCookie(decodeURIComponent(rawValue));
}

export function writeClientCartCookie(items: CartItem[]) {
  if (typeof document === "undefined") {
    return;
  }

  const serialized = encodeURIComponent(serializeCartCookie(items));
  document.cookie = `${CART_COOKIE_NAME}=${serialized}; Path=/; Max-Age=${MAX_COOKIE_AGE_SECONDS}; SameSite=Lax`;
}
