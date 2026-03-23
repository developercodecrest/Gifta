import { badRequest, fail, ok, unauthorized } from "@/lib/api-response";
import { createMobileTokenBundle } from "@/lib/server/mobile-session-service";
import { verifyOtpAndGetUser } from "@/lib/server/otp-service";
import { parseRole } from "@/lib/roles";

export const runtime = "nodejs";

type SignInRequest = {
  email?: string;
  phone?: string;
  fullName?: string;
  otp?: string;
  intent?: "signin" | "signup";
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as SignInRequest;
  const email = body.email?.trim();
  const phone = body.phone?.trim();
  const fullName = body.fullName?.trim();
  const otp = body.otp?.trim();

  if ((!email && !phone) || !otp) {
    return badRequest("email or phone and otp are required");
  }

  const user = await verifyOtpAndGetUser({
    email,
    phone,
    otp,
    createIfMissing: body.intent === "signup",
    fullName,
  });

  if (!user) {
    return fail(401, { code: "OTP_INVALID", message: "Invalid otp. Try again." });
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
    user: {
      id: tokenBundle.user.id,
      email: tokenBundle.user.email,
      fullname: tokenBundle.user.fullName ?? "",
      phone: tokenBundle.user.phone ?? "",
      role: parseRole(tokenBundle.user.role),
      token: tokenBundle.token,
    },
  });
}
