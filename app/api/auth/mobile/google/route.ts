import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { badRequest, ok, unauthorized } from "@/lib/api-response";
import { parseRole } from "@/lib/roles";
import { upsertProfile } from "@/lib/server/ecommerce-service";
import { getGoogleAuthAudiences, getPrimaryGoogleClientId } from "@/lib/server/google-auth-config";
import { createMobileTokenBundle } from "@/lib/server/mobile-session-service";
import { ensureAuthUserRole, getAuthUserByEmail } from "@/lib/server/otp-service";

export const runtime = "nodejs";

type GoogleSignInRequest = {
  idToken?: string;
  intent?: "signin" | "signup";
};

const googleClient = new OAuth2Client(getPrimaryGoogleClientId() || undefined);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as GoogleSignInRequest;
  const idToken = body.idToken?.trim();

  if (!idToken) {
    return badRequest("idToken is required");
  }

  const audiences = getGoogleAuthAudiences();
  if (!audiences.length) {
    return unauthorized("Google auth is not configured on server");
  }

  let payload: TokenPayload | undefined;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: audiences,
    });
    payload = ticket.getPayload();
  } catch {
    return unauthorized("Invalid Google token");
  }

  const email = payload?.email?.trim().toLowerCase();
  const isEmailVerified = Boolean(payload?.email_verified);

  if (!email || !isEmailVerified) {
    return unauthorized("Google account email is not verified");
  }

  const intent = body.intent ?? "signin";
  const existingUser = await getAuthUserByEmail(email);

  if (!existingUser && intent === "signin") {
    return unauthorized("Account does not exist. Please sign up first.");
  }

  const user = await ensureAuthUserRole(email, "USER", {
    fullName: payload?.name?.trim() || undefined,
  });
  await upsertProfile(
    {
      email,
      fullName: payload?.name?.trim() || undefined,
    },
    user.id,
  );

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
