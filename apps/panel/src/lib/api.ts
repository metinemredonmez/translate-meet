/**
 * Typed admin API client. Every request/response type comes from the generated OpenAPI
 * types in @translate-meet/shared/api; nothing is hand-written here except the error body.
 *
 * - Same origin only: "/api/*" is rewritten by Next.js to the backend (next.config.ts).
 * - Session = httpOnly cookie tm_admin; JS never sees or stores a token (SES-01, WEB-05).
 * - Unsafe methods carry x-csrf-token = cookie tm_csrf (double-submit bound to the session, WEB-03).
 * - Any 401 outside the login steps sends the browser to /login.
 */
import type { components, paths } from "@translate-meet/shared/api";
import { ApiError, parseErrorBody } from "./errors";
import { redirectToLogin } from "./navigation";

export type Schemas = components["schemas"];

export const API_PREFIX = "/api";
export const CSRF_COOKIE = "tm_csrf";
export const CSRF_HEADER = "x-csrf-token";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";
const UNSAFE: ReadonlySet<HttpMethod> = new Set(["post", "put", "patch", "delete"]);

type MethodsOf<P extends keyof paths> = {
  [M in HttpMethod]: paths[P][M] extends undefined ? never : M;
}[HttpMethod];

type Operation<P extends keyof paths, M extends MethodsOf<P>> = Exclude<paths[P][M], undefined>;

type QueryOf<O> = O extends { parameters: { query?: infer Q } } ? Exclude<Q, undefined> : never;
type PathOf<O> = O extends { parameters: { path: infer PP } } ? PP : never;
type BodyOf<O> = O extends { requestBody: { content: { "application/json": infer B } } } ? B : never;
type ResponseOf<O> = O extends { responses: { 200: { content: { "application/json": infer R } } } }
  ? R
  : null;

type Opt<K extends string, V> = [V] extends [never] ? { [_ in K]?: never } : { [_ in K]: V };
type OptionalOpt<K extends string, V> = [V] extends [never] ? { [_ in K]?: never } : { [_ in K]?: V };

export type RequestOptions<O> = OptionalOpt<"query", QueryOf<O>> &
  Opt<"path", PathOf<O>> &
  Opt<"body", BodyOf<O>> & {
    signal?: AbortSignal;
    /** Login steps answer 401 for wrong credentials; those must not bounce to /login. */
    redirectOn401?: boolean;
  };

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  for (const part of document.cookie.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) {
      try {
        return decodeURIComponent(part.slice(idx + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

function buildUrl(template: string, path?: Record<string, unknown>, query?: Record<string, unknown>): string {
  const filled = template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = path?.[key];
    if (value === undefined || value === null || value === "") {
      throw new ApiError(0, "client_error", `missing path parameter ${key}`);
    }
    return encodeURIComponent(String(value));
  });
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return `${API_PREFIX}${filled}${qs ? `?${qs}` : ""}`;
}

export async function apiRequest<P extends keyof paths, M extends MethodsOf<P>>(
  method: M,
  path: P,
  options: RequestOptions<Operation<P, M>>,
): Promise<ResponseOf<Operation<P, M>>> {
  const opts = options as {
    query?: Record<string, unknown>;
    path?: Record<string, unknown>;
    body?: unknown;
    signal?: AbortSignal;
    redirectOn401?: boolean;
  };
  const url = buildUrl(path as string, opts.path, opts.query);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (UNSAFE.has(method)) {
    const csrf = readCookie(CSRF_COOKIE);
    if (csrf) headers[CSRF_HEADER] = csrf;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: method.toUpperCase(),
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
      signal: opts.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "network", "network error");
  }

  if (response.status === 401 && opts.redirectOn401 !== false) {
    redirectToLogin();
  }

  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    const parsed = parseErrorBody(body);
    throw new ApiError(response.status, parsed?.code ?? "error", parsed?.message ?? "request failed");
  }

  if (response.status === 204) return null as ResponseOf<Operation<P, M>>;
  try {
    return (await response.json()) as ResponseOf<Operation<P, M>>;
  } catch {
    throw new ApiError(response.status, "invalid_response", "invalid response body");
  }
}

/** Thin, named wrappers used by the pages. */
export const adminApi = {
  login: (body: Schemas["LoginIn"]) =>
    apiRequest("post", "/v1/admin/auth/login", { body, redirectOn401: false }),
  mfa: (body: Schemas["MfaIn"]) => apiRequest("post", "/v1/admin/auth/mfa", { body, redirectOn401: false }),
  logout: () => apiRequest("post", "/v1/admin/auth/logout", { redirectOn401: false }),
  me: (opts: { redirectOn401?: boolean; signal?: AbortSignal } = {}) =>
    apiRequest("get", "/v1/admin/me", opts),
  stats: (signal?: AbortSignal) => apiRequest("get", "/v1/admin/stats", { signal }),
  users: (query: { q?: string; page?: number; page_size?: number }, signal?: AbortSignal) =>
    apiRequest("get", "/v1/admin/users", { query, signal }),
  user: (userId: string, signal?: AbortSignal) =>
    apiRequest("get", "/v1/admin/users/{user_id}", { path: { user_id: userId }, signal }),
  disableUser: (userId: string, body: Schemas["DisableIn"]) =>
    apiRequest("post", "/v1/admin/users/{user_id}/disable", { path: { user_id: userId }, body }),
  enableUser: (userId: string) =>
    apiRequest("post", "/v1/admin/users/{user_id}/enable", { path: { user_id: userId } }),
  providers: (signal?: AbortSignal) => apiRequest("get", "/v1/admin/providers", { signal }),
  checkProviders: () => apiRequest("post", "/v1/admin/providers/check", {}),
  audit: (query: { page?: number; page_size?: number; action?: string }, signal?: AbortSignal) =>
    apiRequest("get", "/v1/admin/audit", { query, signal }),
};
