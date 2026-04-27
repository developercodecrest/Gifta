import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { deleteStoreScoped, updateStoreScoped } from "@/lib/server/ecommerce-service";
import { StoreCategoryOption, VendorSummaryDto } from "@/types/api";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const identity = await authorizeAdminRequest(request, "vendors");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      slug?: string;
      rating?: number;
      active?: boolean;
      category?: string;
      subcategory?: string;
      categories?: StoreCategoryOption[];
      location?: VendorSummaryDto["location"];
    };

    const hasLocationUpdate = Boolean(
      body.location
      && typeof body.location === "object"
      && Object.values(body.location).some((value) => typeof value === "string"),
    );

    if (
      typeof body.name !== "string" &&
      typeof body.slug !== "string" &&
      typeof body.rating !== "number" &&
      typeof body.active !== "boolean" &&
      typeof body.category !== "string" &&
      typeof body.subcategory !== "string" &&
      !Array.isArray(body.categories) &&
      !hasLocationUpdate
    ) {
      return badRequest("Provide at least one valid field to update");
    }

    const updated = await updateStoreScoped({
      storeId: id,
      updates: body,
      scope: identity,
    });

    return ok(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_STORE_SCOPE") {
      return unauthorized("Not allowed");
    }

    return serverError("Unable to update store", error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const identity = await authorizeAdminRequest(request, "vendors");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const { id } = await context.params;
    const result = await deleteStoreScoped({ storeId: id, scope: identity });
    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_STORE_SCOPE") {
      return unauthorized("Not allowed");
    }

    return serverError("Unable to delete store", error);
  }
}
