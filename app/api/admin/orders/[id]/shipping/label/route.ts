import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { DelhiveryApiError, generateDelhiveryShippingLabel, isDelhiveryConfigured } from "@/lib/server/delhivery-service";
import { getAdminOrdersScoped } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function GET(
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

    const { searchParams } = new URL(request.url);
    const pdf = (searchParams.get("pdf") ?? "true").trim().toLowerCase() !== "false";
    const pdfSize = ((searchParams.get("pdfSize") ?? "4R").trim().toUpperCase() === "A4" ? "A4" : "4R") as "A4" | "4R";

    const label = await generateDelhiveryShippingLabel({
      waybill: target.shippingAwb,
      pdf,
      pdfSize,
    });

    return ok(label);
  } catch (error) {
    if (error instanceof DelhiveryApiError) {
      return serverError("Unable to generate Delhivery shipping label.", {
        code: error.code,
        status: error.status,
        upstream: error.body,
      });
    }

    return serverError("Unable to generate Delhivery shipping label.", error);
  }
}
