import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { deleteAdminItemScoped, getMergedCategoryValuesForStoreScoped, updateAdminItemScoped } from "@/lib/server/ecommerce-service";
import { ProductAttribute, ProductMediaItem, ProductVariant, ProductVariantUnit } from "@/types/ecommerce";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const identity = await authorizeAdminRequest(request, "items");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      shortDescription?: string;
      description?: string;
      category?: string;
      price?: number;
      inStock?: boolean;
      featured?: boolean;
      tags?: string[];
      images?: string[];
      media?: unknown;
      offerStoreId?: string;
      offerPrice?: number;
      originalPrice?: number;
      deliveryEtaHours?: number;
      offerInStock?: boolean;
      attributes?: unknown;
      variants?: unknown;
    };

    if (
      typeof body.name !== "string" &&
      typeof body.shortDescription !== "string" &&
      typeof body.description !== "string" &&
      typeof body.category !== "string" &&
      typeof body.price !== "number" &&
      typeof body.inStock !== "boolean" &&
      typeof body.featured !== "boolean" &&
      !Array.isArray(body.tags) &&
      !Array.isArray(body.images) &&
      body.media === undefined &&
      typeof body.offerStoreId !== "string" &&
      typeof body.offerPrice !== "number" &&
      typeof body.originalPrice !== "number" &&
      typeof body.deliveryEtaHours !== "number" &&
      typeof body.offerInStock !== "boolean" &&
      body.attributes === undefined &&
      body.variants === undefined
    ) {
      return badRequest("Provide at least one valid field to update");
    }

    const parsedMedia = parseMediaInput(body.media);
    if (parsedMedia.error) {
      return badRequest(parsedMedia.error);
    }

    const parsedAttributeAndVariant = parseAttributesAndVariants(body.attributes, body.variants);
    if (parsedAttributeAndVariant.error) {
      return badRequest(parsedAttributeAndVariant.error);
    }

    if (typeof body.category === "string" && body.category.trim() && typeof body.offerStoreId === "string" && body.offerStoreId.trim()) {
      const categoryScope = await getMergedCategoryValuesForStoreScoped({
        storeId: body.offerStoreId,
        scope: identity,
      });

      const allowedCategories = new Set<string>(categoryScope.mergedCategoryValues.map((entry) => entry.trim()).filter(Boolean));
      if (!allowedCategories.has(body.category.trim())) {
        return badRequest("Category must match global or vendor category mapping for the selected vendor");
      }
      body.category = body.category.trim();
    }

    const updated = await updateAdminItemScoped({
      itemId: id,
      updates: {
        ...body,
        media: parsedMedia.media,
        attributes: parsedAttributeAndVariant.attributes,
        variants: parsedAttributeAndVariant.variants,
      },
      scope: identity,
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_STORE_SCOPE") {
      return unauthorized("Not allowed");
    }
    if (error instanceof Error && error.message === "FORBIDDEN_ITEM_SCOPE") {
      return unauthorized("Not allowed");
    }
    if (error instanceof Error && error.message === "ITEM_NOT_FOUND") {
      return badRequest("Item not found");
    }
    if (error instanceof Error && error.message === "OFFER_NOT_FOUND") {
      return badRequest("Offer not found for selected store");
    }

    return serverError("Unable to update item", error);
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
  attributes: ProductAttribute[] | undefined;
  variants: ProductVariant[] | undefined;
  error?: string;
} {
  if (attributesInput === undefined && variantsInput === undefined) {
    return { attributes: undefined, variants: undefined };
  }

  if (attributesInput !== undefined && !Array.isArray(attributesInput)) {
    return { attributes: undefined, variants: undefined, error: "attributes must be an array" };
  }

  if (variantsInput !== undefined && !Array.isArray(variantsInput)) {
    return { attributes: undefined, variants: undefined, error: "variants must be an array" };
  }

  const attributes: ProductAttribute[] = [];
  const attributeNames = new Set<string>();
  const allowedValuesByAttribute = new Map<string, Set<string>>();

  for (const entry of (attributesInput as unknown[] | undefined) ?? []) {
    if (!entry || typeof entry !== "object") {
      return { attributes: undefined, variants: undefined, error: "Each attribute must be an object" };
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
      return { attributes: undefined, variants: undefined, error: "Each attribute must include a name" };
    }

    if (attributeNames.has(rawName)) {
      return { attributes: undefined, variants: undefined, error: `Duplicate attribute name: ${rawName}` };
    }

    if (!values.length) {
      return { attributes: undefined, variants: undefined, error: `Attribute ${rawName} must include at least one value` };
    }

    attributeNames.add(rawName);
    allowedValuesByAttribute.set(rawName, new Set(values));
    attributes.push({ name: rawName, values });
  }

  const variants: ProductVariant[] = [];
  const signatureSet = new Set<string>();
  for (const entry of (variantsInput as unknown[] | undefined) ?? []) {
    if (!entry || typeof entry !== "object") {
      return { attributes: undefined, variants: undefined, error: "Each variant must be an object" };
    }

    const source = entry as {
      id?: unknown;
      options?: unknown;
      salePrice?: unknown;
      regularPrice?: unknown;
      weight?: unknown;
      weightUnit?: unknown;
      inStock?: unknown;
    };

    const variantId = typeof source.id === "string" && source.id.trim() ? source.id.trim() : "";
    const salePrice = typeof source.salePrice === "number" ? source.salePrice : Number(source.salePrice);
    const regularPrice = source.regularPrice === undefined ? undefined : (typeof source.regularPrice === "number" ? source.regularPrice : Number(source.regularPrice));
    const weight = source.weight === undefined ? undefined : (typeof source.weight === "number" ? source.weight : Number(source.weight));
    const weightUnit = source.weightUnit === "g" || source.weightUnit === "kg" ? (source.weightUnit as ProductVariantUnit) : undefined;
    const inStock = source.inStock === undefined ? true : Boolean(source.inStock);

    if (!variantId) {
      return { attributes: undefined, variants: undefined, error: "Each variant must include an id" };
    }

    if (!Number.isFinite(salePrice)) {
      return { attributes: undefined, variants: undefined, error: `Variant ${variantId} must include a numeric salePrice` };
    }

    if (regularPrice !== undefined && !Number.isFinite(regularPrice)) {
      return { attributes: undefined, variants: undefined, error: `Variant ${variantId} regularPrice must be numeric` };
    }

    if (weight !== undefined && !Number.isFinite(weight)) {
      return { attributes: undefined, variants: undefined, error: `Variant ${variantId} weight must be numeric` };
    }

    if (!source.options || typeof source.options !== "object" || Array.isArray(source.options)) {
      return { attributes: undefined, variants: undefined, error: `Variant ${variantId} must include options` };
    }

    const optionsEntries = Object.entries(source.options as Record<string, unknown>)
      .map(([key, value]) => [key.trim(), typeof value === "string" ? value.trim() : ""] as const)
      .filter(([key, value]) => Boolean(key) && Boolean(value));

    const options: Record<string, string> = Object.fromEntries(optionsEntries);
    if (!Object.keys(options).length) {
      return { attributes: undefined, variants: undefined, error: `Variant ${variantId} must include at least one option` };
    }

    if (attributes.length) {
      for (const [attributeName, allowedValues] of allowedValuesByAttribute.entries()) {
        const selected = options[attributeName];
        if (!selected || !allowedValues.has(selected)) {
          return {
            attributes: undefined,
            variants: undefined,
            error: `Variant ${variantId} must provide a valid value for attribute ${attributeName}`,
          };
        }
      }

      for (const key of Object.keys(options)) {
        if (!attributeNames.has(key)) {
          return { attributes: undefined, variants: undefined, error: `Variant ${variantId} uses unknown attribute ${key}` };
        }
      }
    }

    const signature = Object.keys(options)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => `${key}:${options[key]}`)
      .join("|");

    if (signatureSet.has(signature)) {
      return { attributes: undefined, variants: undefined, error: `Duplicate variant combination for ${signature}` };
    }
    signatureSet.add(signature);

    variants.push({
      id: variantId,
      options,
      salePrice: Math.max(0, salePrice),
      regularPrice: regularPrice === undefined ? undefined : Math.max(0, regularPrice),
      weight: weight === undefined ? undefined : Math.max(0, weight),
      weightUnit,
      inStock,
    });
  }

  return {
    attributes: attributesInput === undefined ? undefined : attributes,
    variants: variantsInput === undefined ? undefined : variants,
  };
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const identity = await authorizeAdminRequest(request, "items");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const { id } = await context.params;
    const result = await deleteAdminItemScoped({ itemId: id, scope: identity });
    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_ITEM_SCOPE") {
      return unauthorized("Not allowed");
    }

    return serverError("Unable to delete item", error);
  }
}
