import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { DelhiveryApiError, isDelhiveryConfigured, isDelhiveryShipmentMutable, recordDelhiveryOrderEvent, updateDelhiveryEwaybill } from "@/lib/server/delhivery-service";
import { getAdminOrdersScoped } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

type EwaybillRequest = {
  dcn?: string;
  ewbn?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let target: Awaited<ReturnType<typeof getAdminOrdersScoped>>[number] | undefined;
  let body: EwaybillRequest = {};

  try {
    const identity = await authorizeAdminRequest(request, "orders");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    if (!isDelhiveryConfigured()) {
      return serverError("Delhivery is not configured.", { code: "DELHIVERY_CONFIG_MISSING" });
    }

    const { id } = await context.params;
    body = (await request.json().catch(() => ({}))) as EwaybillRequest;

    const dcn = body.dcn?.trim() ?? "";
    const ewbn = body.ewbn?.trim() ?? "";

    if (!dcn || !ewbn) {
      return badRequest("dcn and ewbn are required.");
    }

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
      return badRequest("E-waybill update is not allowed for the current shipment state.");
    }

    const result = await updateDelhiveryEwaybill({
      waybill: target.shippingAwb,
      dcn,
      ewbn,
    });

    await recordDelhiveryOrderEvent({
      waybill: target.shippingAwb,
      operation: "ewaybill-update",
      status: "ewaybill-updated",
      description: `E-waybill updated via Delhivery API (dcn: ${dcn})`,
      request: { dcn, ewbn },
      response: result.raw,
      raw: result.raw,
      set: {
        shippingProviderStatus: "ewaybill-updated",
      },
    });

    return ok(result);
  } catch (error) {
    if (target?.shippingAwb) {
      await recordDelhiveryOrderEvent({
        waybill: target.shippingAwb,
        operation: "ewaybill-update",
        status: "ewaybill-update-failed",
        description: error instanceof Error ? error.message : "Unable to update Delhivery e-waybill.",
        request: body,
        response: error instanceof DelhiveryApiError ? error.body : { message: error instanceof Error ? error.message : "Unknown error" },
        raw: error instanceof DelhiveryApiError ? error.body : { message: error instanceof Error ? error.message : "Unknown error" },
        ...(error instanceof DelhiveryApiError ? { statusCode: error.status, errorCode: error.code } : {}),
      }).catch(() => undefined);
    }

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
