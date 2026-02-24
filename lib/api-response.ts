import { NextResponse } from "next/server";
import { ApiErrorPayload } from "@/types/api";

export function ok<TData, TMeta = Record<string, never>>(data: TData, meta?: TMeta, init?: ResponseInit) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    init,
  );
}

export function fail(status: number, error: ApiErrorPayload) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status },
  );
}

export function badRequest(message: string, details?: unknown) {
  return fail(400, { code: "BAD_REQUEST", message, details });
}

export function unauthorized(message: string) {
  return fail(401, { code: "UNAUTHORIZED", message });
}

export function notFound(message: string) {
  return fail(404, { code: "NOT_FOUND", message });
}

export function serverError(message = "Unexpected server error", details?: unknown) {
  return fail(500, { code: "INTERNAL_ERROR", message, details });
}
