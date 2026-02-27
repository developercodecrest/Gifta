import { badRequest, ok, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { updateItemQuantityLimits } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const identity = await authorizeAdminRequest(request, "items");
  if (!identity) {
    return unauthorized("Not allowed");
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    minOrderQty?: number;
    maxOrderQty?: number;
  };

  if (typeof body.minOrderQty !== "number" || typeof body.maxOrderQty !== "number") {
    return badRequest("minOrderQty and maxOrderQty are required numbers");
  }

  try {
    const updated = await updateItemQuantityLimits({
      itemId: id,
      minOrderQty: body.minOrderQty,
      maxOrderQty: body.maxOrderQty,
      scope: identity,
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_ITEM_SCOPE") {
      return unauthorized("Not allowed");
    }

    throw error;
  }
}
