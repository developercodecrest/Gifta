import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { isDelhiveryConfigured, runDelhiveryDiagnostics } from "@/lib/server/delhivery-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await authorizeAdminRequest(request, "settings");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    if (!isDelhiveryConfigured()) {
      return serverError("Delhivery is not configured.", { code: "DELHIVERY_CONFIG_MISSING" });
    }

    const { searchParams } = new URL(request.url);
    const pinCode = searchParams.get("pinCode")?.trim() ?? "";
    if (!pinCode) {
      return badRequest("pinCode is required.");
    }

    const diagnostics = await runDelhiveryDiagnostics(pinCode);
    return ok(diagnostics);
  } catch (error) {
    return serverError("Unable to test Delhivery integration.", error);
  }
}
