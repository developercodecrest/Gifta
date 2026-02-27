import { ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { getAdminRiders } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await authorizeAdminRequest(request, "riders");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const payload = await getAdminRiders();
    return ok(payload);
  } catch (error) {
    return serverError("Unable to fetch admin riders", error);
  }
}
