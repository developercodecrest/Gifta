import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { createAdminItemScoped, getAdminItemsScoped } from "@/lib/server/ecommerce-service";

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
      category?: string;
      price?: number;
      originalPrice?: number;
      deliveryEtaHours?: number;
      description?: string;
      images?: string[];
      tags?: string[];
      featured?: boolean;
      inStock?: boolean;
      minOrderQty?: number;
      maxOrderQty?: number;
    };

    if (!body.name || !body.category || typeof body.price !== "number" || !body.storeId?.trim()) {
      return badRequest("storeId, name, category and price are required");
    }

    const created = await createAdminItemScoped({
      payload: {
        storeId: body.storeId,
        name: body.name,
        category: body.category,
        price: body.price,
        originalPrice: body.originalPrice,
        deliveryEtaHours: body.deliveryEtaHours,
        description: body.description,
        images: body.images,
        tags: body.tags,
        featured: body.featured,
        inStock: body.inStock,
        minOrderQty: body.minOrderQty,
        maxOrderQty: body.maxOrderQty,
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
    return serverError("Unable to create item", error);
  }
}
