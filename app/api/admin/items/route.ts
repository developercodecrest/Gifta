import { ok, serverError, unauthorized } from "@/lib/api-response";
import { canAccess } from "@/lib/roles";
import { getAdminItems } from "@/lib/server/ecommerce-service";
import { resolveRequestIdentity } from "@/lib/server/request-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await resolveRequestIdentity(request);
    if (!identity?.userId || !canAccess(identity.role, "items")) {
      return unauthorized("Not allowed");
    }

    const data = await getAdminItems();
    return ok(data.items, data.meta);
  } catch (error) {
    return serverError("Unable to fetch admin items", error);
  }
}
