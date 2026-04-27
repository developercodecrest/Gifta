import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { DelhiveryApiError, fetchDelhiveryWaybillsBulk, fetchDelhiveryWaybillSingle, isDelhiveryConfigured, persistDelhiveryWaybills } from "@/lib/server/delhivery-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await authorizeAdminRequest(request, "settings");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    if (!isDelhiveryConfigured()) {
      return serverError("Delhivery is not configured.", { code: "DELHIVERY_CONFIG_MISSING" });
    }

    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get("mode") ?? "single").trim().toLowerCase();

    if (mode === "bulk") {
      const count = Number(searchParams.get("count") ?? "25");
      if (!Number.isFinite(count) || count < 1) {
        return badRequest("count must be a positive number.");
      }
      const waybills = await fetchDelhiveryWaybillsBulk(count);
      const pool = await persistDelhiveryWaybills({
        waybills: waybills.waybills,
        source: "bulk",
      });

      return ok({
        ...waybills,
        pool,
      });
    }

    if (mode !== "single") {
      return badRequest("mode must be single or bulk.");
    }

    const waybill = await fetchDelhiveryWaybillSingle();
    const pool = await persistDelhiveryWaybills({
      waybills: [waybill.waybill],
      source: "single",
    });

    return ok({
      ...waybill,
      pool,
    });
  } catch (error) {
    if (error instanceof DelhiveryApiError) {
      return serverError("Unable to fetch Delhivery waybill.", {
        code: error.code,
        status: error.status,
        upstream: error.body,
      });
    }

    return serverError("Unable to fetch Delhivery waybill.", error);
  }
}
