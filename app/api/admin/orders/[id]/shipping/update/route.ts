import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { getMongoDb } from "@/lib/mongodb";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { DelhiveryApiError, isDelhiveryConfigured, isDelhiveryShipmentMutable, updateDelhiveryShipmentByWaybill } from "@/lib/server/delhivery-service";
import { getAdminOrdersScoped } from "@/lib/server/ecommerce-service";
import { AdminOrderDto } from "@/types/api";

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
  try {
    const identity = await authorizeAdminRequest(request, "orders");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    if (!isDelhiveryConfigured()) {
      return serverError("Delhivery is not configured.", { code: "DELHIVERY_CONFIG_MISSING" });
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as UpdateRequest;

    const orders = await getAdminOrdersScoped(identity);
    const target = orders.find((entry) => entry.id === id);

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

    const db = await getMongoDb();
    const ordersCollection = db.collection<AdminOrderDto>("orders");

    await ordersCollection.updateOne(
      { id: target.id },
      {
        $set: {
          shippingProvider: "delhivery",
          shippingProviderStatus: "shipment-updated",
          shippingLastSyncedAt: new Date().toISOString(),
        },
        $push: {
          shippingEvents: {
            timestamp: new Date().toISOString(),
            status: "shipment-updated",
            description: "Shipment updated via Delhivery edit API",
          },
        },
      },
    );

    return ok(result);
  } catch (error) {
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
