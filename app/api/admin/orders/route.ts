import { ok, serverError, unauthorized } from "@/lib/api-response";
import { canAccess } from "@/lib/roles";
import { getAdminOrders } from "@/lib/server/ecommerce-service";
import { resolveRequestIdentity } from "@/lib/server/request-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await resolveRequestIdentity(request);
    if (!identity?.userId || !canAccess(identity.role, "orders")) {
      return unauthorized("Not allowed");
    }

    const payload = await getAdminOrders();
    return ok(payload);
  } catch (error) {
    return serverError("Unable to fetch admin orders", error);
  }
}
