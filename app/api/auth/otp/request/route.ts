import { badRequest, fail, ok, serverError } from "@/lib/api-response";
import { requestOtpForEmail } from "@/lib/server/otp-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    if (!email) {
      return badRequest("Email is required.");
    }

    const ip = request.headers.get("x-forwarded-for") ?? undefined;
    const result = await requestOtpForEmail({ email, ip });

    if (!result.ok) {
      if (result.code === "OTP_RATE_LIMIT") {
        return fail(429, {
          code: result.code,
          message: result.message,
          details: {
            retryAfterMs: result.retryAfterMs,
            sendsLeft: result.sendsLeft,
          },
        });
      }

      return badRequest(result.message);
    }

    return ok({ message: result.message, sendsLeft: result.sendsLeft });
  } catch (error) {
    return serverError("Unable to send OTP", error);
  }
}
