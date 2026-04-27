import { cookies } from "next/headers";
import { badRequest, ok, serverError } from "@/lib/api-response";
import { CART_COOKIE_NAME, parseCartCookie } from "@/lib/cart-cookie";
import { buildCartSnapshot } from "@/lib/server/cart-service";
import { DelhiveryApiError, estimateDelhiveryCheckoutDeliveryFee, getDelhiveryExpectedTatSummary, getDelhiveryOriginPins, isDelhiveryConfigured } from "@/lib/server/delhivery-service";
import { resolveRequestIdentity } from "@/lib/server/request-auth";
import { getUserCart } from "@/lib/server/user-cart-service";
import { PaymentMethod } from "@/types/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pinCode = (url.searchParams.get("pinCode") ?? "").trim();
    const paymentMethodParam = (url.searchParams.get("paymentMethod") ?? "razorpay").trim().toLowerCase();

    if (!pinCode) {
      return badRequest("pinCode is required.");
    }

    if (paymentMethodParam !== "razorpay" && paymentMethodParam !== "cod") {
      return badRequest("paymentMethod must be razorpay or cod.");
    }

    const identity = await resolveRequestIdentity(request);
    const userId = identity?.userId;

    let cartItems = userId ? await getUserCart(userId).catch(() => []) : [];
    if (!cartItems.length) {
      const cookieStore = await cookies();
      const cartCookie = cookieStore.get(CART_COOKIE_NAME)?.value;
      cartItems = parseCartCookie(cartCookie);
    }

    const snapshot = await buildCartSnapshot(cartItems);
    if (!snapshot.lines.length) {
      return badRequest("Cart is empty.");
    }

    const estimate = await estimateDelhiveryCheckoutDeliveryFee({
      destinationPin: pinCode,
      paymentMethod: paymentMethodParam as PaymentMethod,
      snapshot,
    });
    let expectedTat = estimate.expectedTat;

    if (isDelhiveryConfigured() && estimate.source === "delhivery") {
      const storeIds = Array.from(
        new Set(
          snapshot.lines
            .map((line) => line.selectedOffer?.storeId)
            .filter((storeId): storeId is string => Boolean(storeId && storeId !== "direct")),
        ),
      );

      const originPins = await getDelhiveryOriginPins(storeIds);
      if (originPins.length) {
        try {
          expectedTat = await getDelhiveryExpectedTatSummary({
            originPins,
            destinationPin: pinCode,
          });
        } catch (error) {
          if (error instanceof DelhiveryApiError) {
            expectedTat = {
              source: "fallback",
              estimates: [],
              remark: "Expected delivery timeline unavailable right now.",
            };
          } else {
            throw error;
          }
        }
      }
    }

    return ok(expectedTat ? { ...estimate, expectedTat } : estimate);
  } catch (error) {
    if (error instanceof DelhiveryApiError) {
      return ok({
        estimatedFee: 99,
        source: "fallback",
        serviceable: true,
        remark: undefined,
      });
    }

    return serverError("Unable to fetch delivery estimate", error);
  }
}
