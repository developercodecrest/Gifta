import { notFound, ok, serverError } from "@/lib/api-response";
import { getItemOffers } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const offers = await getItemOffers(slug);
    if (!offers) {
      return notFound("Item not found");
    }
    return ok(offers);
  } catch (error) {
    return serverError("Unable to fetch item offers", error);
  }
}
