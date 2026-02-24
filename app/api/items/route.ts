import { badRequest, ok, serverError } from "@/lib/api-response";
import { searchQuerySchema } from "@/lib/server/api-schemas";
import { searchItems } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const queryObject = Object.fromEntries(new URL(request.url).searchParams.entries());
    const parsed = searchQuerySchema.safeParse(queryObject);
    if (!parsed.success) {
      return badRequest("Invalid search query", parsed.error.flatten());
    }

    const result = await searchItems(parsed.data);
    return ok(result.items, result.meta);
  } catch (error) {
    return serverError("Unable to fetch items", error);
  }
}
