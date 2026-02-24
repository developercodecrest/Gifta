import { badRequest, ok } from "@/lib/api-response";
import { getAuthUserByEmail } from "@/lib/server/otp-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email")?.trim();

  if (!email) {
    return badRequest("Email is required");
  }

  const user = await getAuthUserByEmail(email);

  return ok({
    exists: Boolean(user),
  });
}
