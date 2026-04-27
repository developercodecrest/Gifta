import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { getMongoDb } from "@/lib/mongodb";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { DelhiveryApiError, isDelhiveryConfigured, isDelhiveryShipmentMutable, updateDelhiveryEwaybill } from "@/lib/server/delhivery-service";
import { getAdminOrdersScoped } from "@/lib/server/ecommerce-service";
import { AdminOrderDto } from "@/types/api";

export const runtime = "nodejs";

type EwaybillRequest = {
  dcn?: string;
  ewbn?: string;
};

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
    const body = (await request.json().catch(() => ({}))) as EwaybillRequest;

    const dcn = body.dcn?.trim() ?? "";
    const ewbn = body.ewbn?.trim() ?? "";

    if (!dcn || !ewbn) {
      return badRequest("dcn and ewbn are required.");
    }

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
      return badRequest("E-waybill update is not allowed for the current shipment state.");
    }

    const result = await updateDelhiveryEwaybill({
      waybill: target.shippingAwb,
      dcn,
      ewbn,
    });

    const db = await getMongoDb();
    const ordersCollection = db.collection<AdminOrderDto>("orders");

    await ordersCollection.updateOne(
      { id: target.id },
      {
        $set: {
          shippingProvider: "delhivery",
          shippingProviderStatus: "ewaybill-updated",
          shippingLastSyncedAt: new Date().toISOString(),
        },
        $push: {
          shippingEvents: {
            timestamp: new Date().toISOString(),
            status: "ewaybill-updated",
            description: `E-waybill updated via Delhivery API (dcn: ${dcn})`,
          },
        },
      },
    );

    return ok(result);
  } catch (error) {
    if (error instanceof DelhiveryApiError) {
      return serverError("Unable to update Delhivery e-waybill.", {
        code: error.code,
        status: error.status,
        upstream: error.body,
      });
    }

    return serverError("Unable to update Delhivery e-waybill.", error);
  }
}
