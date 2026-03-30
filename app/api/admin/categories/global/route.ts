import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { updateGlobalCategoriesSchema } from "@/lib/server/api-schemas";
import { getGlobalCategorySettings, updateGlobalCategoryOptions } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await authorizeAdminRequest(request, "vendors");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const settings = await getGlobalCategorySettings();
    return ok(settings);
  } catch (error) {
    return serverError("Unable to fetch global categories", error);
  }
}

export async function PATCH(request: Request) {
  try {
    const identity = await authorizeAdminRequest(request, "vendors");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = updateGlobalCategoriesSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid global categories payload", parsed.error.flatten());
    }

    const settings = await updateGlobalCategoryOptions({
      categories: parsed.data.categories,
      customizableCategories: parsed.data.customizableCategories,
      updatedBy: identity.userId,
    });

    return ok(settings);
  } catch (error) {
    return serverError("Unable to update global categories", error);
  }
}
