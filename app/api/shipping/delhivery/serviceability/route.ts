import { badRequest, ok, serverError } from "@/lib/api-response";
import { checkDelhiveryServiceability, DelhiveryApiError, isDelhiveryConfigured } from "@/lib/server/delhivery-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!isDelhiveryConfigured()) {
      return serverError("Delhivery is not configured.", { code: "DELHIVERY_CONFIG_MISSING" });
    }

    const { searchParams } = new URL(request.url);
    const pinCode = searchParams.get("pinCode")?.trim() ?? "";
    if (!pinCode) {
      return badRequest("pinCode is required.");
    }

    const result = await checkDelhiveryServiceability(pinCode);
    return ok(result);
  } catch (error) {
    if (error instanceof DelhiveryApiError) {
      return serverError("Unable to check Delhivery serviceability.", {
        code: error.code,
        status: error.status,
        upstream: error.body,
      });
    }
    return serverError("Unable to check Delhivery serviceability.", error);
  }
}
