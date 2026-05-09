import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { respondWithDelhiveryError } from "@/lib/server/delhivery-error-response";
import { DelhiveryApiError, ensureDelhiveryWarehouseForStore, isDelhiveryConfigured, recordDelhiveryOrderEvent, scheduleDelhiveryPickup } from "@/lib/server/delhivery-service";
import { getAdminOrdersScoped } from "@/lib/server/ecommerce-service";

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
  let target: Awaited<ReturnType<typeof getAdminOrdersScoped>>[number] | undefined;
  let payload: PickupPayload = {};

  try {
    const identity = await authorizeAdminRequest(request, "orders");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    if (!isDelhiveryConfigured()) {
      return serverError("Delhivery is not configured.", { code: "DELHIVERY_CONFIG_MISSING" });
    }

    const { id } = await context.params;
    payload = (await request.json().catch(() => ({}))) as PickupPayload;

    const orders = await getAdminOrdersScoped(identity);
    target = orders.find((entry) => entry.id === id);

    if (!target) {
      return unauthorized("Not allowed");
    }

    const requestedPickupLocation = payload.pickupLocation?.trim() || target.pickupAddress?.receiverName || target.storeId;
    const pickupDate = payload.pickupDate?.trim() || new Date().toISOString().slice(0, 10);
    const pickupTime = payload.pickupTime?.trim() || "11:00:00";
    const expectedPackageCount = Math.max(1, Math.floor(payload.expectedPackageCount ?? target.quantity ?? 1));

    const { pickupAddress, pickupLocationName } = await ensureDelhiveryWarehouseForStore({
      storeId: target.storeId,
      pickupAddress: target.pickupAddress,
      pickupLocationName: requestedPickupLocation,
    });

    if (!pickupLocationName) {
      return badRequest("pickupLocation is required.");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate)) {
      return badRequest("pickupDate must be in YYYY-MM-DD format.");
    }

    if (!/^\d{2}:\d{2}:\d{2}$/.test(pickupTime)) {
      return badRequest("pickupTime must be in HH:mm:ss format.");
    }

    const result = await scheduleDelhiveryPickup({
      pickupLocation: pickupLocationName,
      pickupDate,
      pickupTime,
      expectedPackageCount,
    });

    await recordDelhiveryOrderEvent({
      waybill: target.shippingAwb,
      orderRef: target.orderRef,
      operation: "pickup-request",
      status: "pickup-requested",
      description: `Pickup requested for ${pickupDate} ${pickupTime} at ${pickupLocationName}`,
      request: {
        pickupLocation: pickupLocationName,
        pickupDate,
        pickupTime,
        expectedPackageCount,
      },
      response: result.raw,
      raw: result.raw,
      set: {
        ...(result.pickupRequestId ? { shippingPickupRequestId: result.pickupRequestId } : {}),
        pickupAddress,
        shippingProviderStatus: "pickup-requested",
      },
    });

    return ok(result);
  } catch (error) {
    if (target) {
      await recordDelhiveryOrderEvent({
        waybill: target.shippingAwb,
        orderRef: target.orderRef,
        operation: "pickup-request",
        status: "pickup-request-failed",
        description: error instanceof Error ? error.message : "Unable to schedule Delhivery pickup.",
        request: payload,
        response: error instanceof DelhiveryApiError ? error.body : { message: error instanceof Error ? error.message : "Unknown error" },
        raw: error instanceof DelhiveryApiError ? error.body : { message: error instanceof Error ? error.message : "Unknown error" },
        ...(error instanceof DelhiveryApiError ? { statusCode: error.status, errorCode: error.code } : {}),
      }).catch(() => undefined);
    }

    if (error instanceof DelhiveryApiError) {
      return respondWithDelhiveryError(error, "Unable to schedule Delhivery pickup.");
    }

    return serverError("Unable to schedule Delhivery pickup.", error);
  }
}
