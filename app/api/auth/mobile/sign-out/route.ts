import { badRequest, ok } from "@/lib/api-response";
import { revokeMobileSessionByRefreshToken } from "@/lib/server/mobile-session-service";

export const runtime = "nodejs";

type SignOutRequest = {
  refreshToken?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as SignOutRequest;
  const refreshToken = body.refreshToken?.trim();

  if (!refreshToken) {
    return badRequest("refreshToken is required");
  }

  await revokeMobileSessionByRefreshToken(refreshToken);
  return ok({ signedOut: true });
}
