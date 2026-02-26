import { badRequest, ok, serverError } from "@/lib/api-response";
import { getItemsByIds } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const rawIds = params.get("ids") ?? "";
    const ids = rawIds
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (!ids.length) {
      return badRequest("ids query param is required");
    }

    const items = await getItemsByIds(ids);
    return ok(items);
  } catch (error) {
    return serverError("Unable to fetch item list", error);
  }
}
