import { ok, serverError, unauthorized } from "@/lib/api-response";
import { getUserNotifications, markNotificationsRead } from "@/lib/server/ecommerce-service";
import { resolveRequestIdentity } from "@/lib/server/request-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await resolveRequestIdentity(request);
    if (!identity?.userId) {
      return unauthorized("Sign in required");
    }

    const result = await getUserNotifications({
      customerEmail: identity.email ?? undefined,
      userId: identity.userId,
    });
    return ok(result);
  } catch (error) {
    return serverError("Unable to fetch notifications", error);
  }
}

export async function PATCH(request: Request) {
  try {
    const identity = await resolveRequestIdentity(request);
    if (!identity?.userId) {
      return unauthorized("Sign in required");
    }

    const payload = (await request.json().catch(() => ({}))) as {
      notificationIds?: string[];
      markAll?: boolean;
    };

    const result = await markNotificationsRead({
      userId: identity.userId,
      customerEmail: identity.email ?? undefined,
      notificationIds: payload.notificationIds,
      markAll: payload.markAll,
    });

    return ok(result);
  } catch (error) {
    return serverError("Unable to update notifications", error);
  }
}
