import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { resolveRequestIdentity } from "@/lib/server/request-auth";
import { upsertUserDevicePushToken } from "@/lib/server/user-device-token-service";

export const runtime = "nodejs";

type DeviceTokenPayload = {
  token?: string;
  platform?: "android" | "ios" | "web";
};

export async function POST(request: Request) {
  try {
    const identity = await resolveRequestIdentity(request);
    if (!identity?.userId) {
      return unauthorized("Sign in required");
    }

    const payload = (await request.json().catch(() => ({}))) as DeviceTokenPayload;
    const token = payload.token?.trim();
    const platform = payload.platform;

    if (!token || (platform !== "android" && platform !== "ios" && platform !== "web")) {
      return badRequest("Invalid push token payload");
    }

    await upsertUserDevicePushToken({
      userId: identity.userId,
      token,
      platform,
    });

    return ok({
      registered: true,
      token,
    });
  } catch (error) {
    return serverError("Unable to register device token", error);
  }
}