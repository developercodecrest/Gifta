import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { getMongoDb } from "@/lib/mongodb";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { DelhiveryApiError, isDelhiveryConfigured, scheduleDelhiveryPickup } from "@/lib/server/delhivery-service";
import { getAdminOrdersScoped } from "@/lib/server/ecommerce-service";
import { AdminOrderDto } from "@/types/api";

export const runtime = "nodejs";

type PickupPayload = {
  pickupLocation?: string;
  pickupDate?: string;
  pickupTime?: string;
  expectedPackageCount?: number;
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
    const payload = (await request.json().catch(() => ({}))) as PickupPayload;

    const orders = await getAdminOrdersScoped(identity);
    const target = orders.find((entry) => entry.id === id);

    if (!target) {
      return unauthorized("Not allowed");
    }

    const pickupLocation = payload.pickupLocation?.trim() || target.pickupAddress?.receiverName || target.storeId;
    const pickupDate = payload.pickupDate?.trim() || new Date().toISOString().slice(0, 10);
    const pickupTime = payload.pickupTime?.trim() || "11:00:00";
    const expectedPackageCount = Math.max(1, Math.floor(payload.expectedPackageCount ?? target.quantity ?? 1));

    if (!pickupLocation) {
      return badRequest("pickupLocation is required.");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate)) {
      return badRequest("pickupDate must be in YYYY-MM-DD format.");
    }

    if (!/^\d{2}:\d{2}:\d{2}$/.test(pickupTime)) {
      return badRequest("pickupTime must be in HH:mm:ss format.");
    }

    const result = await scheduleDelhiveryPickup({
      pickupLocation,
      pickupDate,
      pickupTime,
      expectedPackageCount,
    });

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
          shippingPickupRequestId: result.pickupRequestId,
          shippingProviderStatus: "pickup-requested",
          shippingLastSyncedAt: new Date().toISOString(),
        },
        $push: {
          shippingEvents: {
            timestamp: new Date().toISOString(),
            status: "pickup-requested",
            description: `Pickup requested for ${pickupDate} ${pickupTime} at ${pickupLocation}`,
          },
        },
      },
    );

    return ok(result);
  } catch (error) {
    if (error instanceof DelhiveryApiError) {
      return serverError("Unable to schedule Delhivery pickup.", {
        code: error.code,
        status: error.status,
        upstream: error.body,
      });
    }

    return serverError("Unable to schedule Delhivery pickup.", error);
  }
}
