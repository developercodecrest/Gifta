import { badRequest, ok, unauthorized } from "@/lib/api-response";
import { auth } from "@/auth";
import { setUserCart, getUserCart } from "@/lib/server/user-cart-service";
import { CartItem } from "@/types/ecommerce";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return unauthorized("Sign in required");
  }

  const items = await getUserCart(userId);
  return ok({ items });
}

export async function PUT(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

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
