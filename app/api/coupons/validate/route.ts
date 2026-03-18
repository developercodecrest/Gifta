import { badRequest, ok, serverError } from "@/lib/api-response";
import { validateCouponCode } from "@/lib/server/coupon-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code") ?? "";
    const subtotal = Number(url.searchParams.get("subtotal") ?? "0");

    if (!Number.isFinite(subtotal)) {
      return badRequest("Invalid subtotal.");
    }

    const result = await validateCouponCode(code, subtotal);
    return ok(result);
  } catch (error) {
    return serverError("Unable to validate coupon", error);
  }
}
