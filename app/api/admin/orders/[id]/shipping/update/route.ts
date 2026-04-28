import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { DelhiveryApiError, isDelhiveryConfigured, isDelhiveryShipmentMutable, recordDelhiveryOrderEvent, updateDelhiveryShipmentByWaybill } from "@/lib/server/delhivery-service";
import { getAdminOrdersScoped } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

type UpdateRequest = {
  name?: string;
  phone?: string;
  add?: string;
  productsDesc?: string;
  paymentType?: "COD" | "Pre-paid";
  codAmount?: number;
  gm?: number;
  shipmentHeight?: number;
  shipmentWidth?: number;
  shipmentLength?: number;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let target: Awaited<ReturnType<typeof getAdminOrdersScoped>>[number] | undefined;
  let body: UpdateRequest = {};

  try {
    const identity = await authorizeAdminRequest(request, "orders");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    if (!isDelhiveryConfigured()) {
      return serverError("Delhivery is not configured.", { code: "DELHIVERY_CONFIG_MISSING" });
    }

    const { id } = await context.params;
    body = (await request.json().catch(() => ({}))) as UpdateRequest;

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
      return badRequest("Shipment update is not allowed for the current shipment state.");
    }

    const result = await updateDelhiveryShipmentByWaybill({
      waybill: target.shippingAwb,
      updates: body,
    });

    await recordDelhiveryOrderEvent({
      waybill: target.shippingAwb,
      operation: "shipment-update",
      status: "shipment-updated",
      description: "Shipment updated via Delhivery edit API",
      request: body,
      response: result.raw,
      raw: result.raw,
      set: {
        shippingProviderStatus: "shipment-updated",
      },
    });

    return ok(result);
  } catch (error) {
    if (
      target?.shippingAwb &&
      !(error instanceof Error && error.message.includes("Provide at least one shipment field"))
    ) {
      await recordDelhiveryOrderEvent({
        waybill: target.shippingAwb,
        operation: "shipment-update",
        status: "shipment-update-failed",
        description: error instanceof Error ? error.message : "Unable to update Delhivery shipment.",
        request: body,
        response: error instanceof DelhiveryApiError ? error.body : { message: error instanceof Error ? error.message : "Unknown error" },
        raw: error instanceof DelhiveryApiError ? error.body : { message: error instanceof Error ? error.message : "Unknown error" },
        ...(error instanceof DelhiveryApiError ? { statusCode: error.status, errorCode: error.code } : {}),
      }).catch(() => undefined);
    }

    if (error instanceof DelhiveryApiError) {
      return serverError("Unable to update Delhivery shipment.", {
        code: error.code,
        status: error.status,
        upstream: error.body,
      });
    }

    if (error instanceof Error && error.message.includes("Provide at least one shipment field")) {
      return badRequest(error.message);
    }

    return serverError("Unable to update Delhivery shipment.", error);
  }
}
