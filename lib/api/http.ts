import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

import { resolveDeviceSession } from "@/lib/api/tokens";

/**
 * Shared plumbing for the mobile REST API.
 *
 * Every error has the same shape so the iOS client can decode one type:
 *   { "error": { "code": "unauthorized", "message": "…", "fields": {…}? } }
 */

export type ApiErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "server_error";

const STATUS: Record<ApiErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  server_error: 500,
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, string>
) {
  return NextResponse.json(
    { error: { code, message, ...(fields ? { fields } : {}) } },
    { status: STATUS[code] }
  );
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/** Thrown by handlers to produce a specific response without unwinding by hand. */
export class ApiFailure extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly fields?: Record<string, string>
  ) {
    super(message);
  }
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const [scheme, value] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) return null;
  return value.trim();
}

/**
 * Resolves the caller. Every handler that touches user data goes through this;
 * a `userId` in a body or query string is never trusted.
 */
export async function requireUser(request: Request): Promise<string> {
  const token = bearerToken(request);
  if (!token) {
    throw new ApiFailure("unauthorized", "Sign in to continue.");
  }

  const session = await resolveDeviceSession(token);
  if (!session) {
    throw new ApiFailure("unauthorized", "Your session has expired.");
  }

  return session.userId;
}

export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>
): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiFailure("bad_request", "Expected a JSON body.");
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiFailure(
      "bad_request",
      parsed.error.issues[0]?.message ?? "That request wasn't valid.",
      fieldErrors(parsed.error)
    );
  }
  return parsed.data;
}

function fieldErrors(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !fields[key]) fields[key] = issue.message;
  }
  return fields;
}

/**
 * Wraps a handler so thrown failures become clean responses and anything
 * unexpected becomes a 500 without leaking internals to the client.
 */
export function handler<Args extends unknown[]>(
  fn: (request: Request, ...args: Args) => Promise<Response>
) {
  return async (request: Request, ...args: Args): Promise<Response> => {
    try {
      return await fn(request, ...args);
    } catch (error) {
      if (error instanceof ApiFailure) {
        return apiError(error.code, error.message, error.fields);
      }
      if (error instanceof Error && error.message === "NOT_FOUND") {
        return apiError("not_found", "That doesn't exist.");
      }
      console.error("[api] unhandled", error);
      return apiError("server_error", "Something went wrong on our side.");
    }
  };
}

/** Client-supplied device label, used only to name sessions in settings. */
export function deviceName(request: Request): string | null {
  return request.headers.get("x-device-name");
}
