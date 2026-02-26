import { badRequest, ok, unauthorized } from "@/lib/api-response";
import { mergeUserCart } from "@/lib/server/user-cart-service";
import { resolveRequestIdentity } from "@/lib/server/request-auth";
import { CartItem } from "@/types/ecommerce";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const identity = await resolveRequestIdentity(request);
  const userId = identity?.userId;

  if (!userId) {
    return unauthorized("Sign in required");
  }

  const body = (await request.json().catch(() => ({}))) as { items?: CartItem[] };
  if (!Array.isArray(body.items)) {
    return badRequest("Invalid cart payload");
  }

  const items = await mergeUserCart(userId, body.items);
  return ok({ items });
}
