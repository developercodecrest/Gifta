import { badRequest, notFound, ok, serverError } from "@/lib/api-response";
import { paginationQuerySchema } from "@/lib/server/api-schemas";
import { getItemComments } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const queryObject = Object.fromEntries(new URL(request.url).searchParams.entries());
    const parsed = paginationQuerySchema.safeParse(queryObject);
    if (!parsed.success) {
      return badRequest("Invalid pagination query", parsed.error.flatten());
    }

    const result = await getItemComments(slug, parsed.data.page, parsed.data.pageSize);
    if (!result) {
      return notFound("Item not found");
    }

    return ok(result.items, {
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / parsed.data.pageSize)),
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
    });
  } catch (error) {
    return serverError("Unable to fetch item comments", error);
  }
}
