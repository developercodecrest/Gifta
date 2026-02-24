import { auth } from "@/auth";
import { badRequest, ok, unauthorized } from "@/lib/api-response";
import { canAccess, parseRole } from "@/lib/roles";
import { updateItemQuantityLimits } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const role = parseRole(session?.user?.role ?? "user");

  if (!session?.user?.id || !canAccess(role, "items")) {
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

  const updated = await updateItemQuantityLimits({
    itemId: id,
    minOrderQty: body.minOrderQty,
    maxOrderQty: body.maxOrderQty,
  });

  return ok(updated);
}
