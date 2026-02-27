import { OAuth2Client } from "google-auth-library";
import { badRequest, ok, unauthorized } from "@/lib/api-response";
import { createMobileTokenBundle } from "@/lib/server/mobile-session-service";
import { ensureAuthUserRole, getAuthUserByEmail } from "@/lib/server/otp-service";

export const runtime = "nodejs";

type GoogleSignInRequest = {
  idToken?: string;
  intent?: "signin" | "signup";
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as GoogleSignInRequest;
  const idToken = body.idToken?.trim();

  if (!idToken) {
    return badRequest("idToken is required");
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    return unauthorized("Google auth is not configured on server");
  }

  let payload: Awaited<ReturnType<typeof googleClient.verifyIdToken>>["payload"];
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
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

  const user = await ensureAuthUserRole(email, "user");

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
  });
}
