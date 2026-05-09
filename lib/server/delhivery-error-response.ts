import { fail } from "@/lib/api-response";
import { DelhiveryApiError, extractDelhiveryErrorMessage } from "@/lib/server/delhivery-service";

export function respondWithDelhiveryError(error: DelhiveryApiError, fallbackMessage: string) {
  const status = error.status >= 400 && error.status < 600 ? error.status : 502;

  return fail(status, {
    code: error.code,
    message: extractDelhiveryErrorMessage(error.body, error.message || fallbackMessage),
    details: {
      status: error.status,
      upstream: error.body,
    },
  });
}
