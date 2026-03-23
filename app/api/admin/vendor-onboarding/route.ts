import { badRequest, fail, ok, serverError, unauthorized } from "@/lib/api-response";
import { vendorOnboardingListQuerySchema } from "@/lib/server/api-schemas";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { listVendorOnboardingSubmissions } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await authorizeAdminRequest(request, "vendors");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const url = new URL(request.url);
    const parsed = vendorOnboardingListQuerySchema.safeParse({
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });

    if (!parsed.success) {
      return badRequest("Invalid query parameters", parsed.error.flatten());
    }

    const result = await listVendorOnboardingSubmissions({
      ...parsed.data,
      scope: {
        role: identity.role,
        userId: identity.userId,
      },
    });

    return ok(result.items, {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_SUPER_ADMIN_ONLY") {
      return fail(403, { code: "FORBIDDEN", message: "Super-admin access required" });
    }

    return serverError("Unable to fetch vendor onboarding submissions", error);
  }
}
