import { ok, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const identity = await authorizeAdminRequest(request, "settings");
  if (!identity) {
    return unauthorized("Not allowed");
  }

  const keyId = process.env.RAZORPAY_KEY_ID ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

  return ok({
    configured: Boolean(keyId && keySecret && webhookSecret),
    keyIdPresent: Boolean(keyId),
    keySecretPresent: Boolean(keySecret),
    webhookSecretPresent: Boolean(webhookSecret),
    keyIdPreview: keyId ? `${keyId.slice(0, 8)}...` : undefined,
  });
}
