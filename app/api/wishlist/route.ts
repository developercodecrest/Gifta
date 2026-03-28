import { badRequest, ok, unauthorized } from "@/lib/api-response";
import { resolveRequestIdentity } from "@/lib/server/request-auth";
import { getUserWishlist, setUserWishlist } from "@/lib/server/user-wishlist-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const identity = await resolveRequestIdentity(request);
  const userId = identity?.userId;

  if (!userId) {
    return unauthorized("Sign in required");
  }

  const productIds = await getUserWishlist(userId);
  return ok({ productIds });
}

export async function PUT(request: Request) {
  const identity = await resolveRequestIdentity(request);
  const userId = identity?.userId;

  if (!userId) {
    return unauthorized("Sign in required");
  }

  const body = (await request.json().catch(() => ({}))) as { productIds?: string[] };
  if (!Array.isArray(body.productIds) || body.productIds.some((entry) => typeof entry !== "string")) {
    return badRequest("Invalid wishlist payload");
  }

  const productIds = await setUserWishlist(userId, body.productIds);
  return ok({ productIds });
}
