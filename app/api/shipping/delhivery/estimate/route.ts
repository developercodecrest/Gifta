import { cookies } from "next/headers";
import { badRequest, ok, serverError } from "@/lib/api-response";
import { CART_COOKIE_NAME, parseCartCookie } from "@/lib/cart-cookie";
import { buildCartSnapshot } from "@/lib/server/cart-service";
import { DelhiveryApiError, estimateDelhiveryDeliveryFee, getDelhiveryExpectedTatSummary, getDelhiveryOriginPins, isDelhiveryConfigured } from "@/lib/server/delhivery-service";
import { resolveRequestIdentity } from "@/lib/server/request-auth";
import { getUserCart } from "@/lib/server/user-cart-service";

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
    let expectedTat = estimate.expectedTat;

    if (isDelhiveryConfigured()) {
      const identity = await resolveRequestIdentity(request);
      const userId = identity?.userId;

      let cartItems = userId ? await getUserCart(userId).catch(() => []) : [];
      if (!cartItems.length) {
        const cookieStore = await cookies();
        const cartCookie = cookieStore.get(CART_COOKIE_NAME)?.value;
        cartItems = parseCartCookie(cartCookie);
      }

      if (cartItems.length) {
        const snapshot = await buildCartSnapshot(cartItems);
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
    }

    return ok(expectedTat ? { ...estimate, expectedTat } : estimate);
  } catch (error) {
    if (error instanceof DelhiveryApiError) {
      return ok({
        estimatedFee: 99,
        source: "fallback",
        serviceable: true,
        remark: "Delhivery estimate unavailable, fallback applied.",
        expectedTat: {
          source: "fallback",
          estimates: [],
          remark: "Expected delivery timeline unavailable right now.",
        },
      });
    }

    return serverError("Unable to fetch delivery estimate", error);
  }
}
