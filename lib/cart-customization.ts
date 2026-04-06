import { CartItem, CartItemCustomization } from "@/types/ecommerce";

const MAX_CUSTOMIZATION_IMAGES = 15;
const WHATSAPP_REGEX = /^\+?[0-9]{8,15}$/;

function clampText(value: string | undefined, maxLength: number) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, maxLength);
}

function normalizeImageUrls(images: unknown) {
  if (!Array.isArray(images)) {
    return [] as string[];
  }

  const normalized = Array.from(
    new Set(
      images
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter((entry) => /^https?:\/\//i.test(entry)),
    ),
  );

  return normalized.slice(0, MAX_CUSTOMIZATION_IMAGES);
}

function normalizeWhatsappNumber(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const compact = value.replace(/\s+/g, "").trim();
  if (!compact) {
    return undefined;
  }

  return WHATSAPP_REGEX.test(compact) ? compact : undefined;
}

function fnv1a(input: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16);
}

export function normalizeCartItemCustomization(input: unknown): CartItemCustomization | undefined {
  if (!input || typeof input !== "object") {
    return undefined;
  }

  const source = input as CartItemCustomization;
  const images = normalizeImageUrls(source.images);
  const description = clampText(source.description, 1200);
  const whatsappNumber = normalizeWhatsappNumber(source.whatsappNumber);
  const giftWrap = Boolean(source.giftWrap);
  const giftCard = Boolean(source.giftCard);
  const giftMessage = Boolean(source.giftMessage);
  const approvalByEmail = Boolean(source.approvalByEmail);

  if (!images.length && !description && !whatsappNumber && !giftWrap && !giftCard && !giftMessage && !approvalByEmail) {
    return undefined;
  }

  return {
    ...(images.length ? { images } : {}),
    ...(description ? { description } : {}),
    ...(whatsappNumber ? { whatsappNumber } : {}),
    ...(giftWrap ? { giftWrap: true } : {}),
    ...(giftCard ? { giftCard: true } : {}),
    ...(giftMessage ? { giftMessage: true } : {}),
    ...(approvalByEmail ? { approvalByEmail: true } : {}),
  };
}

export function createCustomizationSignature(customization?: CartItemCustomization) {
  const normalized = normalizeCartItemCustomization(customization);
  if (!normalized) {
    return undefined;
  }

  const payload = JSON.stringify({
    images: normalized.images ?? [],
    description: normalized.description ?? "",
    whatsappNumber: normalized.whatsappNumber ?? "",
    giftWrap: Boolean(normalized.giftWrap),
    giftCard: Boolean(normalized.giftCard),
    giftMessage: Boolean(normalized.giftMessage),
    approvalByEmail: Boolean(normalized.approvalByEmail),
  });

  return `cs-${fnv1a(payload)}`;
}

export function resolveCustomizationSignature(input: {
  customization?: CartItemCustomization;
  customizationSignature?: string;
}) {
  const normalizedCustomization = normalizeCartItemCustomization(input.customization);
  if (!normalizedCustomization) {
    return {
      customization: undefined,
      customizationSignature: undefined,
    };
  }

  const normalizedSignature =
    typeof input.customizationSignature === "string" && input.customizationSignature.trim()
      ? input.customizationSignature.trim()
      : createCustomizationSignature(normalizedCustomization);

  return {
    customization: normalizedCustomization,
    customizationSignature: normalizedSignature,
  };
}

export function getCartLineIdentity(input: {
  productId: string;
  variantId?: string;
  customization?: CartItemCustomization;
  customizationSignature?: string;
}) {
  const productId = input.productId.trim();
  const variantId = input.variantId?.trim() || "default";
  const signature =
    input.customizationSignature?.trim() ||
    createCustomizationSignature(input.customization) ||
    "base";

  return `${productId}::${variantId}::${signature}`;
}

export function normalizeCartLine(input: CartItem): CartItem | null {
  if (typeof input.productId !== "string" || !input.productId.trim()) {
    return null;
  }

  const normalizedQuantity =
    typeof input.quantity === "number" && Number.isFinite(input.quantity)
      ? Math.max(1, Math.floor(input.quantity))
      : 1;

  const normalizedVariantOptions =
    input.variantOptions && typeof input.variantOptions === "object"
      ? Object.fromEntries(
          Object.entries(input.variantOptions)
            .map(([key, value]) => [key.trim(), typeof value === "string" ? value.trim() : ""] as const)
            .filter(([key, value]) => Boolean(key) && Boolean(value)),
        )
      : undefined;

  const customization = resolveCustomizationSignature({
    customization: input.customization,
    customizationSignature: input.customizationSignature,
  });

  return {
    productId: input.productId.trim(),
    quantity: normalizedQuantity,
    offerId: typeof input.offerId === "string" ? input.offerId.trim() || undefined : undefined,
    variantId: typeof input.variantId === "string" ? input.variantId.trim() || undefined : undefined,
    variantOptions: normalizedVariantOptions && Object.keys(normalizedVariantOptions).length ? normalizedVariantOptions : undefined,
    customization: customization.customization,
    customizationSignature: customization.customizationSignature,
  };
}
