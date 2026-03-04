import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/api-response";
import { trackDelhiveryShipment, isDelhiveryConfigured } from "@/lib/server/delhivery-service";
import { getUserOrderDetails } from "@/lib/server/ecommerce-service";
import { resolveRequestIdentity } from "@/lib/server/request-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!isDelhiveryConfigured()) {
      return serverError("Delhivery is not configured.", { code: "DELHIVERY_CONFIG_MISSING" });
    }

    const identity = await resolveRequestIdentity(request);
    if (!identity?.userId) {
      return unauthorized("Sign in required");
    }

    const { searchParams } = new URL(request.url);
    const orderRef = searchParams.get("orderRef")?.trim() ?? "";
    if (!orderRef) {
      return badRequest("orderRef is required.");
    }

    const order = await getUserOrderDetails(orderRef, identity.userId, identity.email ?? undefined);
    if (!order) {
      return notFound("Order not found");
    }

    const tracking = await trackDelhiveryShipment({
      awb: order.shippingAwb,
      orderRef: order.orderRef,
    });

    return ok({
      orderRef: order.orderRef,
      shippingProvider: order.shippingProvider ?? "delhivery",
      shippingProviderStatus: order.shippingProviderStatus,
      awb: tracking.awb ?? order.shippingAwb,
      delivered: tracking.delivered,
      currentStatus: tracking.currentStatus,
      events: tracking.events,
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (error) {
    return serverError("Unable to fetch Delhivery tracking.", error);
  }
}
