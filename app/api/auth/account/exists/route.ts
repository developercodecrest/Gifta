import { badRequest, ok } from "@/lib/api-response";
import { getAuthUserByEmail, getAuthUserByPhone } from "@/lib/server/otp-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const email = params.get("email")?.trim();
  const phone = params.get("phone")?.trim();

  if (!email && !phone) {
    return badRequest("Email or phone is required");
  }

  const user = email ? await getAuthUserByEmail(email) : await getAuthUserByPhone(phone ?? "");

  return ok({
    exists: Boolean(user),
  });
}
