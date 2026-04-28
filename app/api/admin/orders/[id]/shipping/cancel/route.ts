import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { cancelDelhiveryShipmentByWaybill, DelhiveryApiError, isDelhiveryConfigured, isDelhiveryShipmentMutable, recordDelhiveryOrderEvent } from "@/lib/server/delhivery-service";
import { getAdminOrdersScoped } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let target: Awaited<ReturnType<typeof getAdminOrdersScoped>>[number] | undefined;

  try {
    const identity = await authorizeAdminRequest(request, "orders");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    if (!isDelhiveryConfigured()) {
      return serverError("Delhivery is not configured.", { code: "DELHIVERY_CONFIG_MISSING" });
    }

    const { id } = await context.params;
    const orders = await getAdminOrdersScoped(identity);
    target = orders.find((entry) => entry.id === id);

    if (!target) {
      return unauthorized("Not allowed");
    }

    if (!target.shippingAwb?.trim()) {
      return badRequest("AWB is missing for this order row.");
    }

    if (!isDelhiveryShipmentMutable({
      providerStatus: target.shippingProviderStatus,
      orderStatus: target.status,
    })) {
      return badRequest("Shipment cancellation is not allowed for the current shipment state.");
    }

    const result = await cancelDelhiveryShipmentByWaybill(target.shippingAwb);

    await recordDelhiveryOrderEvent({
      waybill: target.shippingAwb,
      orderRef: target.orderRef,
      operation: "shipment-cancel",
      status: "shipment-cancel-requested",
      description: "Shipment cancellation triggered via Delhivery API",
      request: { waybill: target.shippingAwb, cancellation: true },
      response: result.raw,
      raw: result.raw,
      set: {
        status: "cancelled",
        shippingProviderStatus: "shipment-cancel-requested",
      },
    });

    return ok(result);
  } catch (error) {
    if (target?.shippingAwb) {
      await recordDelhiveryOrderEvent({
        waybill: target.shippingAwb,
        orderRef: target.orderRef,
        operation: "shipment-cancel",
        status: "shipment-cancel-failed",
        description: error instanceof Error ? error.message : "Unable to cancel Delhivery shipment.",
        request: { waybill: target.shippingAwb, cancellation: true },
        response: error instanceof DelhiveryApiError ? error.body : { message: error instanceof Error ? error.message : "Unknown error" },
        raw: error instanceof DelhiveryApiError ? error.body : { message: error instanceof Error ? error.message : "Unknown error" },
        ...(error instanceof DelhiveryApiError ? { statusCode: error.status, errorCode: error.code } : {}),
      }).catch(() => undefined);
    }

    if (error instanceof DelhiveryApiError) {
      return serverError("Unable to cancel Delhivery shipment.", {
        code: error.code,
        status: error.status,
        upstream: error.body,
      });
    }

    return serverError("Unable to cancel Delhivery shipment.", error);
  }
}
