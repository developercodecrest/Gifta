import { badRequest, fail, ok, serverError } from "@/lib/api-response";
import { requestOtpForEmail, requestOtpForPhone } from "@/lib/server/otp-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    if (!email && !phone) {
      return badRequest("Email or phone is required.");
    }

    const ip = request.headers.get("x-forwarded-for") ?? undefined;
    const result = email
      ? await requestOtpForEmail({ email, ip })
      : await requestOtpForPhone({ phone, ip });

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

      if (result.code === "USER_NOT_FOUND") {
        return fail(404, {
          code: result.code,
          message: result.message,
        });
      }

      return badRequest(result.message);
    }

    return ok({ message: result.message, sendsLeft: result.sendsLeft });
  } catch (error) {
    return serverError("Unable to send OTP", error);
  }
}
