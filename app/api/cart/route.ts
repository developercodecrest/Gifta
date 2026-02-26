import { badRequest, ok, unauthorized } from "@/lib/api-response";
import { resolveRequestIdentity } from "@/lib/server/request-auth";
import { setUserCart, getUserCart } from "@/lib/server/user-cart-service";
import { CartItem } from "@/types/ecommerce";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const identity = await resolveRequestIdentity(request);
  const userId = identity?.userId;

  if (!userId) {
    return unauthorized("Sign in required");
  }

  const items = await getUserCart(userId);
  return ok({ items });
}

export async function PUT(request: Request) {
  const identity = await resolveRequestIdentity(request);
  const userId = identity?.userId;

  if (!userId) {
    return unauthorized("Sign in required");
  }

  const body = (await request.json().catch(() => ({}))) as { items?: CartItem[] };
  if (!Array.isArray(body.items)) {
    return badRequest("Invalid cart payload");
  }

  const items = await setUserCart(userId, body.items);
  return ok({ items });
}
