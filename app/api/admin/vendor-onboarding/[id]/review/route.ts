import { badRequest, fail, ok, serverError, unauthorized } from "@/lib/api-response";
import { vendorOnboardingReviewSchema } from "@/lib/server/api-schemas";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { reviewVendorOnboardingSubmission } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const identity = await authorizeAdminRequest(request, "vendors");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const { id } = await context.params;
    if (!id) {
      return badRequest("Submission id is required");
    }

    const body = await request.json().catch(() => null);
    const parsed = vendorOnboardingReviewSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid review payload", parsed.error.flatten());
    }

    const updated = await reviewVendorOnboardingSubmission({
      submissionId: id,
      decision: parsed.data.decision,
      reason: parsed.data.reason,
      scope: {
        role: identity.role,
        userId: identity.userId,
      },
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN_SUPER_ADMIN_ONLY") {
        return fail(403, { code: "FORBIDDEN", message: "Super-admin access required" });
      }

      if (error.message === "VENDOR_ONBOARDING_NOT_FOUND") {
        return fail(404, { code: "NOT_FOUND", message: "Submission not found" });
      }

      if (error.message === "VENDOR_ONBOARDING_ALREADY_REVIEWED") {
        return fail(409, { code: "CONFLICT", message: "Submission has already been reviewed" });
      }
    }

    return serverError("Unable to review vendor onboarding submission", error);
  }
}
