/**
 * Backend error shape (packages/shared/CONTRACT.md): {"error":{"code":string,"message":string}}.
 * The OpenAPI schema does not describe it, so this is the single local definition.
 */
export interface ApiErrorBody {
  error: { code: string; message: string };
}

/** status 0 = no HTTP response (network down, CORS, aborted). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function parseErrorBody(value: unknown): ApiErrorBody["error"] | null {
  if (!value || typeof value !== "object") return null;
  const err = (value as { error?: unknown }).error;
  if (!err || typeof err !== "object") return null;
  const { code, message } = err as { code?: unknown; message?: unknown };
  if (typeof code !== "string" || !code) return null;
  return { code, message: typeof message === "string" ? message : "" };
}

/** Translation keys for a failure; raw server/browser messages are never shown (EXC-01). */
export type ErrorKey =
  | "errors.network"
  | "errors.unauthorized"
  | "errors.forbidden"
  | "errors.notFound"
  | "errors.rateLimited"
  | "errors.validation"
  | "errors.server"
  | "errors.generic";

export function errorKey(err: unknown): ErrorKey {
  if (!(err instanceof ApiError)) return "errors.generic";
  if (err.status === 0) return "errors.network";
  if (err.status === 401) return "errors.unauthorized";
  if (err.status === 403) return "errors.forbidden";
  if (err.status === 404) return "errors.notFound";
  if (err.status === 429 || err.code === "rate_limited") return "errors.rateLimited";
  if (err.status === 422 || err.code === "validation_error") return "errors.validation";
  if (err.status >= 500) return "errors.server";
  return "errors.generic";
}
