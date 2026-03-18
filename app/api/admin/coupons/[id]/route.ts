import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { updateAdminCoupon } from "@/lib/server/coupon-service";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const identity = await authorizeAdminRequest(request, "coupons");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const { id } = await context.params;
    const payload = (await request.json().catch(() => ({}))) as {
      code?: string;
      title?: string;
      description?: string;
      discountType?: "percent" | "flat";
      discountValue?: number;
      maxDiscount?: number | null;
      minSubtotal?: number | null;
      active?: boolean;
      startsAt?: string | null;
      endsAt?: string | null;
      usageLimit?: number | null;
    };

    const coupon = await updateAdminCoupon(id, payload);
    return ok(coupon);
  } catch (error) {
    if (error instanceof Error && error.message === "COUPON_NOT_FOUND") {
      return notFound("Coupon not found.");
    }
    if (error instanceof Error && error.message === "COUPON_CODE_EXISTS") {
      return badRequest("Coupon code already exists.");
    }
    return serverError("Unable to update coupon", error);
  }
}
