import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { createAdminItemScoped, getAdminItemsScoped } from "@/lib/server/ecommerce-service";
import {
  ProductAttribute,
  ProductMediaItem,
  ProductVariant,
  ProductVariantDimensionUnit,
  ProductVariantUnit,
} from "@/types/ecommerce";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await authorizeAdminRequest(request, "items");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const data = await getAdminItemsScoped(identity);
    return ok(data.items, data.meta);
  } catch (error) {
    return serverError("Unable to fetch admin items", error);
  }
}

export async function POST(request: Request) {
  try {
    const identity = await authorizeAdminRequest(request, "items");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const body = (await request.json().catch(() => ({}))) as {
      storeId?: string;
      name?: string;
      shortDescription?: string;
      category?: string;
      subcategory?: string;
      price?: number;
      originalPrice?: number;
      deliveryEtaHours?: number;
      description?: string;
      disclaimerHtml?: string;
      howToPersonaliseHtml?: string;
      brandDetailsHtml?: string;
      images?: string[];
      media?: unknown;
      tags?: string[];
      featured?: boolean;
      inStock?: boolean;
      minOrderQty?: number;
      maxOrderQty?: number;
      attributes?: unknown;
      variants?: unknown;
    };

    if (!body.name || !body.category || typeof body.price !== "number" || !body.storeId?.trim()) {
      return badRequest("storeId, name, category and price are required");
    }

    const parsedMedia = parseMediaInput(body.media);
    if (parsedMedia.error) {
      return badRequest(parsedMedia.error);
    }

    const parsedAttributeAndVariant = parseAttributesAndVariants(body.attributes, body.variants);
    if (parsedAttributeAndVariant.error) {
      return badRequest(parsedAttributeAndVariant.error);
    }

    const created = await createAdminItemScoped({
      payload: {
        storeId: body.storeId,
        name: body.name,
        shortDescription: body.shortDescription,
        category: body.category.trim(),
        subcategory: body.subcategory,
        price: body.price,
        originalPrice: body.originalPrice,
        deliveryEtaHours: body.deliveryEtaHours,
        description: body.description,
        disclaimerHtml: body.disclaimerHtml,
        howToPersonaliseHtml: body.howToPersonaliseHtml,
        brandDetailsHtml: body.brandDetailsHtml,
        images: body.images,
        media: parsedMedia.media,
        tags: body.tags,
        featured: body.featured,
        inStock: body.inStock,
        minOrderQty: body.minOrderQty,
        maxOrderQty: body.maxOrderQty,
        attributes: parsedAttributeAndVariant.attributes,
        variants: parsedAttributeAndVariant.variants,
      },
      scope: identity,
    });

    return ok(created);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_STORE_SCOPE") {
      return unauthorized("Not allowed");
    }
    if (error instanceof Error && error.message === "STORE_REQUIRED_FOR_ITEM_CREATE") {
      return badRequest("Store is required for admin item creation");
    }
    if (error instanceof Error && error.message === "INVALID_GLOBAL_CATEGORY") {
      return badRequest("Category must be selected from global categories");
    }
    if (error instanceof Error && error.message === "INVALID_GLOBAL_SUBCATEGORY") {
      return badRequest("Subcategory must belong to the selected global category");
    }
    return serverError("Unable to create item", error);
  }
}

function parseMediaInput(mediaInput: unknown): {
  media?: ProductMediaItem[];
  error?: string;
} {
  if (mediaInput === undefined) {
    return { media: undefined };
  }

  if (!Array.isArray(mediaInput)) {
    return { error: "media must be an array" };
  }

  const media: ProductMediaItem[] = [];
  for (const entry of mediaInput) {
    if (!entry || typeof entry !== "object") {
      return { error: "Each media entry must be an object" };
    }

    const source = entry as {
      type?: unknown;
      url?: unknown;
      thumbnailUrl?: unknown;
      alt?: unknown;
    };

    const type = source.type === "video" ? "video" : source.type === "image" ? "image" : "";
    const url = typeof source.url === "string" ? source.url.trim() : "";
    if (!type || !url) {
      return { error: "Each media entry must include type and url" };
    }

    media.push({
      type,
      url,
      ...(typeof source.thumbnailUrl === "string" && source.thumbnailUrl.trim() ? { thumbnailUrl: source.thumbnailUrl.trim() } : {}),
      ...(typeof source.alt === "string" && source.alt.trim() ? { alt: source.alt.trim() } : {}),
    });
  }

  return { media };
}

function parseAttributesAndVariants(attributesInput: unknown, variantsInput: unknown): {
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  error?: string;
} {
  if (attributesInput !== undefined && !Array.isArray(attributesInput)) {
    return { attributes: [], variants: [], error: "attributes must be an array" };
  }

  if (variantsInput !== undefined && !Array.isArray(variantsInput)) {
    return { attributes: [], variants: [], error: "variants must be an array" };
  }

  const attributes: ProductAttribute[] = [];
  const attributeNames = new Set<string>();
  const allowedValuesByAttribute = new Map<string, Set<string>>();

  for (const entry of (attributesInput as unknown[] | undefined) ?? []) {
    if (!entry || typeof entry !== "object") {
      return { attributes: [], variants: [], error: "Each attribute must be an object" };
    }

    const rawName = typeof (entry as { name?: unknown }).name === "string" ? (entry as { name: string }).name.trim() : "";
    const rawValues = Array.isArray((entry as { values?: unknown }).values) ? (entry as { values: unknown[] }).values : [];
    const values = Array.from(
      new Set(
        rawValues
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    );

    if (!rawName) {
      return { attributes: [], variants: [], error: "Each attribute must include a name" };
    }

    if (attributeNames.has(rawName)) {
      return { attributes: [], variants: [], error: `Duplicate attribute name: ${rawName}` };
    }

    if (!values.length) {
      return { attributes: [], variants: [], error: `Attribute ${rawName} must include at least one value` };
    }

    attributeNames.add(rawName);
    allowedValuesByAttribute.set(rawName, new Set(values));
    attributes.push({ name: rawName, values });
  }

  const variants: ProductVariant[] = [];
  const signatureSet = new Set<string>();
  for (const entry of (variantsInput as unknown[] | undefined) ?? []) {
    if (!entry || typeof entry !== "object") {
      return { attributes: [], variants: [], error: "Each variant must be an object" };
    }

    const source = entry as {
      id?: unknown;
      options?: unknown;
      salePrice?: unknown;
      regularPrice?: unknown;
      weight?: unknown;
      weightUnit?: unknown;
      size?: unknown;
      width?: unknown;
      height?: unknown;
      dimensionUnit?: unknown;
      inStock?: unknown;
    };

    const variantId = typeof source.id === "string" && source.id.trim() ? source.id.trim() : "";
    const salePrice = typeof source.salePrice === "number" ? source.salePrice : Number(source.salePrice);
    const regularPrice = source.regularPrice === undefined ? undefined : (typeof source.regularPrice === "number" ? source.regularPrice : Number(source.regularPrice));
    const weight = source.weight === undefined ? undefined : (typeof source.weight === "number" ? source.weight : Number(source.weight));
    const weightUnit = source.weightUnit === "g" || source.weightUnit === "kg" ? (source.weightUnit as ProductVariantUnit) : undefined;
    const size = typeof source.size === "string" ? source.size.trim() : "";
    const width = source.width === undefined ? undefined : (typeof source.width === "number" ? source.width : Number(source.width));
    const height = source.height === undefined ? undefined : (typeof source.height === "number" ? source.height : Number(source.height));
    const dimensionUnit = source.dimensionUnit === "cm" ? (source.dimensionUnit as ProductVariantDimensionUnit) : undefined;
    const inStock = source.inStock === undefined ? true : Boolean(source.inStock);

    if (!variantId) {
      return { attributes: [], variants: [], error: "Each variant must include an id" };
    }

    if (!Number.isFinite(salePrice)) {
      return { attributes: [], variants: [], error: `Variant ${variantId} must include a numeric salePrice` };
    }

    if (regularPrice !== undefined && !Number.isFinite(regularPrice)) {
      return { attributes: [], variants: [], error: `Variant ${variantId} regularPrice must be numeric` };
    }

    if (weight !== undefined && !Number.isFinite(weight)) {
      return { attributes: [], variants: [], error: `Variant ${variantId} weight must be numeric` };
    }

    if (width !== undefined && !Number.isFinite(width)) {
      return { attributes: [], variants: [], error: `Variant ${variantId} width must be numeric` };
    }

    if (height !== undefined && !Number.isFinite(height)) {
      return { attributes: [], variants: [], error: `Variant ${variantId} height must be numeric` };
    }

    if (!source.options || typeof source.options !== "object" || Array.isArray(source.options)) {
      return { attributes: [], variants: [], error: `Variant ${variantId} must include options` };
    }

    const optionsEntries = Object.entries(source.options as Record<string, unknown>)
      .map(([key, value]) => [key.trim(), typeof value === "string" ? value.trim() : ""] as const)
      .filter(([key, value]) => Boolean(key) && Boolean(value));

    const options: Record<string, string> = Object.fromEntries(optionsEntries);
    if (!Object.keys(options).length) {
      return { attributes: [], variants: [], error: `Variant ${variantId} must include at least one option` };
    }

    if (attributes.length) {
      for (const [attributeName, allowedValues] of allowedValuesByAttribute.entries()) {
        const selected = options[attributeName];
        if (!selected || !allowedValues.has(selected)) {
          return {
            attributes: [],
            variants: [],
            error: `Variant ${variantId} must provide a valid value for attribute ${attributeName}`,
          };
        }
      }

      for (const key of Object.keys(options)) {
        if (!attributeNames.has(key)) {
          return { attributes: [], variants: [], error: `Variant ${variantId} uses unknown attribute ${key}` };
        }
      }
    }

    const signature = Object.keys(options)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => `${key}:${options[key]}`)
      .join("|");

    if (signatureSet.has(signature)) {
      return { attributes: [], variants: [], error: `Duplicate variant combination for ${signature}` };
    }
    signatureSet.add(signature);

    const normalizedWidth = width === undefined ? undefined : Math.max(0, width);
    const normalizedHeight = height === undefined ? undefined : Math.max(0, height);
    const hasDimensions = normalizedWidth !== undefined || normalizedHeight !== undefined;

    variants.push({
      id: variantId,
      options,
      salePrice: Math.max(0, salePrice),
      regularPrice: regularPrice === undefined ? undefined : Math.max(0, regularPrice),
      weight: weight === undefined ? undefined : Math.max(0, weight),
      weightUnit,
      ...(size ? { size } : {}),
      ...(normalizedWidth !== undefined ? { width: normalizedWidth } : {}),
      ...(normalizedHeight !== undefined ? { height: normalizedHeight } : {}),
      ...(hasDimensions ? { dimensionUnit: dimensionUnit ?? "cm" } : {}),
      inStock,
    });
  }

  return { attributes, variants };
}
