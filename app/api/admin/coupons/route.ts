import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { createAdminCoupon, listAdminCoupons } from "@/lib/server/coupon-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await authorizeAdminRequest(request, "coupons");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const coupons = await listAdminCoupons();
    return ok(coupons);
  } catch (error) {
    return serverError("Unable to fetch coupons", error);
  }
}

export async function POST(request: Request) {
  try {
    const identity = await authorizeAdminRequest(request, "coupons");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const payload = (await request.json().catch(() => ({}))) as {
      code?: string;
      title?: string;
      description?: string;
      discountType?: "percent" | "flat";
      discountValue?: number;
      maxDiscount?: number;
      minSubtotal?: number;
      active?: boolean;
      startsAt?: string;
      endsAt?: string;
      usageLimit?: number;
    };

    if (!payload.code || !payload.title || !payload.discountType || typeof payload.discountValue !== "number") {
      return badRequest("code, title, discountType and discountValue are required.");
    }

    const coupon = await createAdminCoupon({
      code: payload.code,
      title: payload.title,
      description: payload.description,
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      maxDiscount: payload.maxDiscount,
      minSubtotal: payload.minSubtotal,
      active: payload.active,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
      usageLimit: payload.usageLimit,
    });

    return ok(coupon);
  } catch (error) {
    if (error instanceof Error && error.message === "COUPON_CODE_EXISTS") {
      return badRequest("Coupon code already exists.");
    }
    return serverError("Unable to create coupon", error);
  }
}
