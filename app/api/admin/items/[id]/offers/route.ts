import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { deleteAdminItemOfferScoped, upsertAdminItemOfferScoped } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function POST(
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
      storeId?: string;
      price?: number;
      originalPrice?: number;
      inStock?: boolean;
      deliveryEtaHours?: number;
    };

    if (!body.storeId?.trim() || typeof body.price !== "number") {
      return badRequest("storeId and price are required");
    }

    const result = await upsertAdminItemOfferScoped({
      itemId: id,
      payload: {
        storeId: body.storeId.trim(),
        price: body.price,
        originalPrice: body.originalPrice,
        inStock: body.inStock,
        deliveryEtaHours: body.deliveryEtaHours,
      },
      scope: identity,
    });

    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_STORE_SCOPE") {
      return unauthorized("Not allowed");
    }
    if (error instanceof Error && error.message === "ITEM_NOT_FOUND") {
      return badRequest("Item not found");
    }

    return serverError("Unable to save item offer", error);
  }
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
    const body = (await request.json().catch(() => ({}))) as { storeId?: string };
    if (!body.storeId?.trim()) {
      return badRequest("storeId is required");
    }

    const result = await deleteAdminItemOfferScoped({
      itemId: id,
      storeId: body.storeId.trim(),
      scope: identity,
    });

    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_STORE_SCOPE") {
      return unauthorized("Not allowed");
    }

    return serverError("Unable to delete item offer", error);
  }
}