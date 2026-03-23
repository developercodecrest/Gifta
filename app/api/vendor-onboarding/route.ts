import { badRequest, ok, serverError } from "@/lib/api-response";
import { createVendorOnboardingSchema } from "@/lib/server/api-schemas";
import { createVendorOnboardingSubmission } from "@/lib/server/ecommerce-service";
import { getAuthUserByEmail } from "@/lib/server/otp-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = createVendorOnboardingSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid onboarding payload", parsed.error.flatten());
    }

    const email = (parsed.data.store.owner.email ?? "").trim().toLowerCase();
    const existingUser = await getAuthUserByEmail(email);

    const submission = await createVendorOnboardingSubmission({
      payload: parsed.data.store,
      existingUserId: existingUser?._id?.toString(),
    });

    return ok({
      submission,
      message: "Your onboarding request has been submitted and is pending super-admin approval.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "VENDOR_ONBOARDING_EMAIL_REQUIRED") {
      return badRequest("Owner email is required");
    }

    return serverError("Unable to submit vendor onboarding", error);
  }
}
