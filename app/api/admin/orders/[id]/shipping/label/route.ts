import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { respondWithDelhiveryError } from "@/lib/server/delhivery-error-response";
import { DelhiveryApiError, generateDelhiveryShippingLabel, isDelhiveryConfigured, recordDelhiveryOrderEvent } from "@/lib/server/delhivery-service";
import { getAdminOrdersScoped } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let target: Awaited<ReturnType<typeof getAdminOrdersScoped>>[number] | undefined;
  let pdf = true;
  let pdfSize: "A4" | "4R" = "4R";

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

    const { searchParams } = new URL(request.url);
    pdf = (searchParams.get("pdf") ?? "true").trim().toLowerCase() !== "false";
    pdfSize = ((searchParams.get("pdfSize") ?? "4R").trim().toUpperCase() === "A4" ? "A4" : "4R") as "A4" | "4R";

    const label = await generateDelhiveryShippingLabel({
      waybill: target.shippingAwb,
      pdf,
      pdfSize,
    });

    await recordDelhiveryOrderEvent({
      waybill: target.shippingAwb,
      operation: "label-generate",
      status: "label-generated",
      description: `Shipping label generated in ${pdfSize} format`,
      request: {
        waybill: target.shippingAwb,
        pdf,
        pdfSize,
      },
      response: label.raw,
      raw: label.raw,
    });

    return ok(label);
  } catch (error) {
    if (target?.shippingAwb) {
      await recordDelhiveryOrderEvent({
        waybill: target.shippingAwb,
        operation: "label-generate",
        status: "label-generate-failed",
        description: error instanceof Error ? error.message : "Unable to generate Delhivery shipping label.",
        request: {
          waybill: target.shippingAwb,
          pdf,
          pdfSize,
        },
        response: error instanceof DelhiveryApiError ? error.body : { message: error instanceof Error ? error.message : "Unknown error" },
        raw: error instanceof DelhiveryApiError ? error.body : { message: error instanceof Error ? error.message : "Unknown error" },
        ...(error instanceof DelhiveryApiError ? { statusCode: error.status, errorCode: error.code } : {}),
      }).catch(() => undefined);
    }

    if (error instanceof DelhiveryApiError) {
      return respondWithDelhiveryError(error, "Unable to generate Delhivery shipping label.");
    }

    return serverError("Unable to generate Delhivery shipping label.", error);
  }
}
