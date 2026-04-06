export const PRODUCT_IMAGE_FALLBACK = "/products/placeholder-product.svg";

export function resolveProductImage(src: string | null | undefined) {
  const normalized = typeof src === "string" ? src.trim() : "";
  return normalized.length ? normalized : PRODUCT_IMAGE_FALLBACK;
}
