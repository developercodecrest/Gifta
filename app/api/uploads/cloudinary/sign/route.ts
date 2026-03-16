import { createHash } from "crypto";
import { ok, serverError, unauthorized } from "@/lib/api-response";
import { resolveRequestIdentity } from "@/lib/server/request-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const identity = await resolveRequestIdentity(request);
    if (!identity) {
      return unauthorized("Sign in required");
    }

    const body = (await request.json().catch(() => ({}))) as {
      folder?: string;
      resourceType?: "image" | "video" | "raw" | "auto";
    };

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return unauthorized("Cloudinary upload is not configured");
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = (body.folder?.trim() || "gifta").replace(/\s+/g, "-");
    const resourceType = body.resourceType ?? "auto";

    const signatureBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = createHash("sha1").update(signatureBase).digest("hex");

    return ok({
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder,
      resourceType,
    });
  } catch (error) {
    return serverError("Unable to create upload signature", error);
  }
}
