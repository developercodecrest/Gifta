import { badRequest, ok, unauthorized } from "@/lib/api-response";
import { auth } from "@/auth";
import { mergeUserCart } from "@/lib/server/user-cart-service";
import { CartItem } from "@/types/ecommerce";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

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
