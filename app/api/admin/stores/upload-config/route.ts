import { ok, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await authorizeAdminRequest(request, "vendors");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return unauthorized("Cloudinary upload is not configured");
    }

    return ok({ cloudName, uploadPreset });
  } catch (error) {
    return serverError("Unable to fetch upload config", error);
  }
}
