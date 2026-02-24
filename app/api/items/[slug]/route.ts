import { notFound, ok, serverError } from "@/lib/api-response";
import { getItemBySlug } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const item = await getItemBySlug(slug);
    if (!item) {
      return notFound("Item not found");
    }
    return ok(item);
  } catch (error) {
    return serverError("Unable to fetch item details", error);
  }
}
