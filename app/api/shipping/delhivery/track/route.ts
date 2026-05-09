import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/api-response";
import { respondWithDelhiveryError } from "@/lib/server/delhivery-error-response";
import { DelhiveryApiError, isDelhiveryConfigured, recordDelhiveryOrderEvent, trackDelhiveryShipment } from "@/lib/server/delhivery-service";
import { getUserOrderDetails } from "@/lib/server/ecommerce-service";
import { resolveRequestIdentity } from "@/lib/server/request-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  let order: Awaited<ReturnType<typeof getUserOrderDetails>> | null = null;
  let trackingRequest: { orderRef?: string; awb?: string } = {};

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

    order = await getUserOrderDetails(orderRef, identity.userId, identity.email ?? undefined);
    if (!order) {
      return notFound("Order not found");
    }

    trackingRequest = {
      orderRef: order.orderRef,
      awb: order.shippingAwb,
    };

    const tracking = await trackDelhiveryShipment({
      awb: order.shippingAwb,
      orderRef: order.orderRef,
    });

    await recordDelhiveryOrderEvent({
      waybill: tracking.awb ?? order.shippingAwb,
      orderRef: order.orderRef,
      operation: "tracking-sync",
      status: tracking.currentStatus ?? "tracking-synced",
      description: tracking.currentStatus ? `Tracking synced: ${tracking.currentStatus}` : "Tracking synced with Delhivery",
      request: trackingRequest,
      response: tracking.raw,
      raw: tracking.raw,
      set: {
        ...(tracking.currentStatus ? { shippingProviderStatus: tracking.currentStatus } : {}),
      },
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
    if (order?.orderRef || order?.shippingAwb) {
      await recordDelhiveryOrderEvent({
        waybill: order.shippingAwb,
        orderRef: order.orderRef,
        operation: "tracking-sync",
        status: "tracking-sync-failed",
        description: error instanceof Error ? error.message : "Unable to fetch Delhivery tracking.",
        request: trackingRequest,
        response: error instanceof DelhiveryApiError ? error.body : { message: error instanceof Error ? error.message : "Unknown error" },
        raw: error instanceof DelhiveryApiError ? error.body : { message: error instanceof Error ? error.message : "Unknown error" },
        ...(error instanceof DelhiveryApiError ? { statusCode: error.status, errorCode: error.code } : {}),
      }).catch(() => undefined);
    }

    if (error instanceof DelhiveryApiError) {
      return respondWithDelhiveryError(error, "Unable to fetch Delhivery tracking.");
    }

    return serverError("Unable to fetch Delhivery tracking.", error);
  }
}
