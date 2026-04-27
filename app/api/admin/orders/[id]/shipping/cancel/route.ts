import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { getMongoDb } from "@/lib/mongodb";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { cancelDelhiveryShipmentByWaybill, DelhiveryApiError, isDelhiveryConfigured, isDelhiveryShipmentMutable } from "@/lib/server/delhivery-service";
import { getAdminOrdersScoped } from "@/lib/server/ecommerce-service";
import { AdminOrderDto } from "@/types/api";

export const runtime = "nodejs";

export async function POST(
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
      return badRequest("Shipment cancellation is not allowed for the current shipment state.");
    }

    const result = await cancelDelhiveryShipmentByWaybill(target.shippingAwb);

    const db = await getMongoDb();
    const ordersCollection = db.collection<AdminOrderDto>("orders");

    await ordersCollection.updateMany(
      {
        $or: [
          { id: target.id },
          ...(target.orderRef ? [{ orderRef: target.orderRef }] : []),
        ],
      },
      {
        $set: {
          status: "cancelled",
          shippingProvider: "delhivery",
          shippingProviderStatus: "shipment-cancel-requested",
          shippingLastSyncedAt: new Date().toISOString(),
        },
        $push: {
          shippingEvents: {
            timestamp: new Date().toISOString(),
            status: "shipment-cancel-requested",
            description: "Shipment cancellation triggered via Delhivery API",
          },
        },
      },
    );

    return ok(result);
  } catch (error) {
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
