import { badRequest, ok, unauthorized } from "@/lib/api-response";
import { createMobileTokenBundle } from "@/lib/server/mobile-session-service";
import { verifyOtpAndGetUser } from "@/lib/server/otp-service";

export const runtime = "nodejs";

type SignInRequest = {
  email?: string;
  otp?: string;
  intent?: "signin" | "signup";
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as SignInRequest;
  const email = body.email?.trim();
  const otp = body.otp?.trim();

  if (!email || !otp) {
    return badRequest("email and otp are required");
  }

  const user = await verifyOtpAndGetUser({
    email,
    otp,
    createIfMissing: body.intent === "signup",
  });

  if (!user) {
    return unauthorized("Invalid OTP or account does not exist");
  }

  const tokenBundle = await createMobileTokenBundle({
    userId: user.id,
    ip: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  if (!tokenBundle) {
    return unauthorized("Unable to create mobile session");
  }

  return ok({
    token: tokenBundle.token,
    refreshToken: tokenBundle.refreshToken,
    expiresAt: tokenBundle.expiresAt,
    refreshExpiresAt: tokenBundle.refreshExpiresAt,
    userId: tokenBundle.user.id,
    user: tokenBundle.user,
  });
}
