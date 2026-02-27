import { ok, serverError, unauthorized } from "@/lib/api-response";
import { getUserOrders } from "@/lib/server/ecommerce-service";
import { resolveRequestIdentity } from "@/lib/server/request-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await resolveRequestIdentity(request);
    if (!identity?.userId) {
      return unauthorized("Sign in required");
    }

    const orders = await getUserOrders(identity.userId, identity.email ?? undefined);
    return ok(orders);
  } catch (error) {
    return serverError("Unable to fetch orders", error);
  }
}
