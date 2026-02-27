import { ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { getVendorSummariesScoped } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await authorizeAdminRequest(request, "vendors");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const payload = await getVendorSummariesScoped(identity);
    return ok(payload);
  } catch (error) {
    return serverError("Unable to fetch admin vendors", error);
  }
}
