import { notFound, ok, serverError, unauthorized } from "@/lib/api-response";
import { getUserOrderDetails } from "@/lib/server/ecommerce-service";
import { resolveRequestIdentity } from "@/lib/server/request-auth";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderRef: string }> },
) {
  try {
    const identity = await resolveRequestIdentity(request);
    if (!identity?.userId) {
      return unauthorized("Sign in required");
    }

    const { orderRef } = await context.params;
    const order = await getUserOrderDetails(orderRef, identity.userId, identity.email ?? undefined);
    if (!order) {
      return notFound("Order not found");
    }

    return ok(order);
  } catch (error) {
    return serverError("Unable to fetch order details", error);
  }
}
