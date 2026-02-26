import { ok, serverError, unauthorized } from "@/lib/api-response";
import { canAccess } from "@/lib/roles";
import { getVendorSummaries } from "@/lib/server/ecommerce-service";
import { resolveRequestIdentity } from "@/lib/server/request-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await resolveRequestIdentity(request);
    if (!identity?.userId || !canAccess(identity.role, "vendors")) {
      return unauthorized("Not allowed");
    }

    const payload = await getVendorSummaries();
    return ok(payload);
  } catch (error) {
    return serverError("Unable to fetch admin vendors", error);
  }
}
