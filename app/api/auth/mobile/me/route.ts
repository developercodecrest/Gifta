import { ok, unauthorized } from "@/lib/api-response";
import { resolveRequestIdentity } from "@/lib/server/request-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const identity = await resolveRequestIdentity(request);
  if (!identity) {
    return unauthorized("Sign in required");
  }

  return ok({
    userId: identity.userId,
    email: identity.email,
    role: identity.role,
  });
}
