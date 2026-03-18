import { ok, serverError } from "@/lib/api-response";
import { listAvailableCoupons } from "@/lib/server/coupon-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const subtotal = Number(url.searchParams.get("subtotal") ?? "0");
    const coupons = await listAvailableCoupons(Number.isFinite(subtotal) ? subtotal : 0);
    return ok(coupons);
  } catch (error) {
    return serverError("Unable to fetch available coupons", error);
  }
}
