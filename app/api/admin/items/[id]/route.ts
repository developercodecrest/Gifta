import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { deleteAdminItemScoped, updateAdminItemScoped } from "@/lib/server/ecommerce-service";

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
      description?: string;
      category?: string;
      price?: number;
      inStock?: boolean;
      featured?: boolean;
      tags?: string[];
      images?: string[];
      offerStoreId?: string;
      offerPrice?: number;
      originalPrice?: number;
      deliveryEtaHours?: number;
      offerInStock?: boolean;
    };

    if (
      typeof body.name !== "string" &&
      typeof body.description !== "string" &&
      typeof body.category !== "string" &&
      typeof body.price !== "number" &&
      typeof body.inStock !== "boolean" &&
      typeof body.featured !== "boolean" &&
      !Array.isArray(body.tags) &&
      !Array.isArray(body.images) &&
      typeof body.offerStoreId !== "string" &&
      typeof body.offerPrice !== "number" &&
      typeof body.originalPrice !== "number" &&
      typeof body.deliveryEtaHours !== "number" &&
      typeof body.offerInStock !== "boolean"
    ) {
      return badRequest("Provide at least one valid field to update");
    }

    const updated = await updateAdminItemScoped({
      itemId: id,
      updates: body,
      scope: identity,
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_ITEM_SCOPE") {
      return unauthorized("Not allowed");
    }
    if (error instanceof Error && error.message === "OFFER_NOT_FOUND") {
      return badRequest("Offer not found for selected store");
    }

    return serverError("Unable to update item", error);
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
    const result = await deleteAdminItemScoped({ itemId: id, scope: identity });
    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_ITEM_SCOPE") {
      return unauthorized("Not allowed");
    }

    return serverError("Unable to delete item", error);
  }
}
