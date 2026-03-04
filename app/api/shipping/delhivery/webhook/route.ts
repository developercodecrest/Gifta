import crypto from "crypto";
import { badRequest, ok, serverError } from "@/lib/api-response";
import { applyDelhiveryWebhookUpdate, getDelhiveryConfig, isDelhiveryConfigured } from "@/lib/server/delhivery-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isDelhiveryConfigured()) {
      return serverError("Delhivery is not configured.", { code: "DELHIVERY_CONFIG_MISSING" });
    }

    const config = getDelhiveryConfig();
    const rawBody = await request.text();

    if (config.webhookSecret) {
      const headerSignature = request.headers.get("x-delhivery-signature") ?? request.headers.get("x-webhook-signature");
      if (!headerSignature) {
        return badRequest("Missing Delhivery webhook signature header.");
      }

      const expected = crypto.createHmac("sha256", config.webhookSecret).update(rawBody).digest("hex");
      const providedBuffer = Buffer.from(headerSignature, "utf8");
      const expectedBuffer = Buffer.from(expected, "utf8");

      if (providedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
        return badRequest("Invalid Delhivery webhook signature.");
      }
    }

    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const update = await applyDelhiveryWebhookUpdate(payload);

    return ok({
      received: true,
      ...update,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequest("Invalid Delhivery webhook payload.");
    }
    return serverError("Unable to process Delhivery webhook.", error);
  }
}
