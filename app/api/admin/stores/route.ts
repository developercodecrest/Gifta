import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { createStoreSchema } from "@/lib/server/api-schemas";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { createStoreForAdmin, getVendorSummariesScoped } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await authorizeAdminRequest(request, "vendors");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const stores = await getVendorSummariesScoped(identity);
    return ok(stores);
  } catch (error) {
    return serverError("Unable to fetch stores", error);
  }
}

export async function POST(request: Request) {
  try {
    const identity = await authorizeAdminRequest(request, "vendors");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const json = await request.json().catch(() => null);
    const parsed = createStoreSchema.safeParse(json);
    if (!parsed.success) {
      return badRequest("Invalid store payload", parsed.error.flatten());
    }

    const created = await createStoreForAdmin(parsed.data.store, {
      role: identity.role,
      userId: identity.userId,
    });

    return ok(created);
  } catch (error) {
    return serverError("Unable to create store", error);
  }
}
