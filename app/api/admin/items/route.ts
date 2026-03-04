import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { createAdminItemScoped, getAdminItemsScoped } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await authorizeAdminRequest(request, "items");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const data = await getAdminItemsScoped(identity);
    return ok(data.items, data.meta);
  } catch (error) {
    return serverError("Unable to fetch admin items", error);
  }
}

export async function POST(request: Request) {
  try {
    const identity = await authorizeAdminRequest(request, "items");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      category?: string;
      price?: number;
      description?: string;
      images?: string[];
      tags?: string[];
      featured?: boolean;
      inStock?: boolean;
      minOrderQty?: number;
      maxOrderQty?: number;
    };

    if (!body.name || !body.category || typeof body.price !== "number") {
      return badRequest("name, category and price are required");
    }

    const created = await createAdminItemScoped({
      payload: {
        name: body.name,
        category: body.category,
        price: body.price,
        description: body.description,
        images: body.images,
        tags: body.tags,
        featured: body.featured,
        inStock: body.inStock,
        minOrderQty: body.minOrderQty,
        maxOrderQty: body.maxOrderQty,
      },
    });

    return ok(created);
  } catch (error) {
    return serverError("Unable to create item", error);
  }
}
