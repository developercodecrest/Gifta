import { badRequest, ok, unauthorized } from "@/lib/api-response";
import { rotateMobileTokenBundle } from "@/lib/server/mobile-session-service";

export const runtime = "nodejs";

type RefreshRequest = {
  refreshToken?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RefreshRequest;
  const refreshToken = body.refreshToken?.trim();

  if (!refreshToken) {
    return badRequest("refreshToken is required");
  }

  const tokenBundle = await rotateMobileTokenBundle({
    refreshToken,
    ip: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  if (!tokenBundle) {
    return unauthorized("Invalid or expired refresh token");
  }

  return ok({
    token: tokenBundle.token,
    refreshToken: tokenBundle.refreshToken,
    expiresAt: tokenBundle.expiresAt,
    refreshExpiresAt: tokenBundle.refreshExpiresAt,
    userId: tokenBundle.user.id,
  });
}
