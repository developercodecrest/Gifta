import { badRequest, ok, serverError } from "@/lib/api-response";
import { suggestionQuerySchema } from "@/lib/server/api-schemas";
import { getSearchSuggestions } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const queryObject = Object.fromEntries(new URL(request.url).searchParams.entries());
    const parsed = suggestionQuerySchema.safeParse(queryObject);

    if (!parsed.success) {
      return badRequest("Invalid search query", parsed.error.flatten());
    }

    const suggestions = await getSearchSuggestions(parsed.data.q, parsed.data.limit);
    return ok(suggestions);
  } catch (error) {
    return serverError("Unable to fetch suggestions", error);
  }
}
