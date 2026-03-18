import { badRequest, ok, serverError } from "@/lib/api-response";
import { DelhiveryApiError, estimateDelhiveryDeliveryFee } from "@/lib/server/delhivery-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pinCode = (url.searchParams.get("pinCode") ?? "").trim();
    const subtotal = Number(url.searchParams.get("subtotal") ?? "0");

    if (!pinCode) {
      return badRequest("pinCode is required.");
    }

    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return badRequest("subtotal must be a non-negative number.");
    }

    const estimate = await estimateDelhiveryDeliveryFee(pinCode, subtotal);
    return ok(estimate);
  } catch (error) {
    if (error instanceof DelhiveryApiError) {
      return ok({
        estimatedFee: 99,
        source: "fallback",
        serviceable: true,
        remark: "Delhivery estimate unavailable, fallback applied.",
      });
    }

    return serverError("Unable to fetch delivery estimate", error);
  }
}
