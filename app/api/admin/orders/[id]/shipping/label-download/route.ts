import { badRequest, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { respondWithDelhiveryError } from "@/lib/server/delhivery-error-response";
import { DelhiveryApiError, downloadDelhiveryShippingLabelPdf, isDelhiveryConfigured, recordDelhiveryOrderEvent } from "@/lib/server/delhivery-service";
import { getAdminOrdersScoped } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let target: Awaited<ReturnType<typeof getAdminOrdersScoped>>[number] | undefined;
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
    pdfSize = ((searchParams.get("pdfSize") ?? "4R").trim().toUpperCase() === "A4" ? "A4" : "4R") as "A4" | "4R";

    const download = await downloadDelhiveryShippingLabelPdf({
      waybill: target.shippingAwb,
      pdfSize,
    });

    await recordDelhiveryOrderEvent({
      waybill: target.shippingAwb,
      operation: "label-download",
      status: "label-downloaded",
      description: `Shipping label PDF downloaded in ${pdfSize} format`,
      request: {
        waybill: target.shippingAwb,
        pdf: true,
        pdfSize,
      },
      response: {
        labelUrl: download.labelUrl,
        contentType: download.contentType,
        contentDisposition: download.contentDisposition,
        byteLength: download.bytes.byteLength,
      },
      raw: download.labelResponse,
    });

    const fileName = `delhivery-label-${download.waybill}-${download.pdfSize.toLowerCase()}.pdf`;

    return new Response(download.bytes, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(download.bytes.byteLength),
        "Content-Type": download.contentType,
      },
    });
  } catch (error) {
    if (target?.shippingAwb) {
      await recordDelhiveryOrderEvent({
        waybill: target.shippingAwb,
        operation: "label-download",
        status: "label-download-failed",
        description: error instanceof Error ? error.message : "Unable to download Delhivery shipping label PDF.",
        request: {
          waybill: target.shippingAwb,
          pdf: true,
          pdfSize,
        },
        response: error instanceof DelhiveryApiError ? error.body : { message: error instanceof Error ? error.message : "Unknown error" },
        raw: error instanceof DelhiveryApiError ? error.body : { message: error instanceof Error ? error.message : "Unknown error" },
        ...(error instanceof DelhiveryApiError ? { statusCode: error.status, errorCode: error.code } : {}),
      }).catch(() => undefined);
    }

    if (error instanceof DelhiveryApiError) {
      return respondWithDelhiveryError(error, "Unable to download Delhivery shipping label PDF.");
    }

    return serverError("Unable to download Delhivery shipping label PDF.", error);
  }
}