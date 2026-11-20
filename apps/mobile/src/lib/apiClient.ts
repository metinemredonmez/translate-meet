/**
 * Minimal fetch wrapper for apps/api (see packages/shared/CONTRACT.md).
 * - Bearer access token from secure storage
 * - Single-flight refresh on 401 via POST /v1/auth/refresh (refresh tokens rotate; SES-05),
 *   so concurrent 401s share ONE refresh call instead of replaying the old refresh token
 *   (a replay would revoke the whole session family server-side).
 * - Errors normalized to ApiError using the contract shape {"error":{"code","message"}}.
 */
import type { TokenPair, TokenStorage } from './tokenStorage';

export type ApiErrorCode =
  | 'unauthorized'
  | 'not_found'
  | 'quota_exceeded'
  | 'validation_error'
  | 'idempotency_conflict'
  | 'rate_limited'
  | 'internal'
  | 'network'
  | 'unknown';

const KNOWN_CODES: ReadonlySet<string> = new Set([
  'unauthorized',
  'not_found',
  'quota_exceeded',
  'validation_error',
  'idempotency_conflict',
  'rate_limited',
  'internal',
]);

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  constructor(status: number, code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function codeFromStatus(status: number): ApiErrorCode {
  switch (status) {
    case 401:
      return 'unauthorized';
    case 402:
      return 'quota_exceeded';
    case 404:
      return 'not_found';
    case 409:
      return 'idempotency_conflict';
    case 422:
      return 'validation_error';
    case 429:
      return 'rate_limited';
    default:
      return status >= 500 ? 'internal' : 'unknown';
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  let code: ApiErrorCode = codeFromStatus(res.status);
  let message = `HTTP ${res.status}`;
  try {
    const body: unknown = await res.json();
    const err = (body as { error?: { code?: unknown; message?: unknown } } | null)?.error;
    if (err && typeof err.code === 'string' && KNOWN_CODES.has(err.code)) code = err.code as ApiErrorCode;
    if (err && typeof err.message === 'string') message = err.message;
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(res.status, code, message);
}

export interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  /** Send Bearer token and refresh on 401 (default true). */
  auth?: boolean;
  signal?: AbortSignal;
}

export interface ApiClientDeps {
  baseUrl: string;
  storage: TokenStorage;
  fetchImpl?: typeof fetch;
  /** Called when refresh fails and tokens were cleared (session lost). */
  onAuthLost?: () => void;
  getLanguage?: () => string;
}

export interface ApiClient {
  request<T>(method: string, path: string, opts?: RequestOptions): Promise<T>;
  get<T>(path: string, opts?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'body'>): Promise<T>;
  /** Exposed for tests/diagnostics. */
  refreshTokens(): Promise<string>;
}

export function createApiClient(deps: ApiClientDeps): ApiClient {
  const doFetch = deps.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  let refreshInFlight: Promise<string> | null = null;

  async function performRefresh(): Promise<string> {
    const refreshToken = await deps.storage.getRefreshToken();
    if (!refreshToken) throw new ApiError(401, 'unauthorized', 'No refresh token');
    let res: Response;
    try {
      res = await doFetch(`${deps.baseUrl}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      // Network failure: keep tokens, the user is not necessarily signed out.
      throw new ApiError(0, 'network', 'Network request failed');
    }
    if (!res.ok) {
      const err = await toApiError(res);
      if (res.status === 401) {
        await deps.storage.clear();
        deps.onAuthLost?.();
      }
      throw err;
    }
    const pair = (await res.json()) as TokenPair;
    if (typeof pair?.access_token !== 'string' || typeof pair?.refresh_token !== 'string') {
      throw new ApiError(500, 'internal', 'Malformed token response');
    }
    await deps.storage.setTokens(pair);
    return pair.access_token;
  }

  /** Single-flight: every concurrent caller awaits the same promise. */
  function refreshTokens(): Promise<string> {
    if (!refreshInFlight) {
      refreshInFlight = performRefresh().finally(() => {
        refreshInFlight = null;
      });
    }
    return refreshInFlight;
  }

  async function send(method: string, path: string, opts: RequestOptions, token: string | null) {
    const headers: Record<string, string> = { Accept: 'application/json', ...opts.headers };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const lang = deps.getLanguage?.();
    if (lang) headers['Accept-Language'] = lang;
    try {
      return await doFetch(`${deps.baseUrl}${path}`, {
        method,
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        signal: opts.signal,
      });
    } catch (e) {
      if ((e as { name?: string } | null)?.name === 'AbortError') throw e;
      throw new ApiError(0, 'network', 'Network request failed');
    }
  }

  async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    const useAuth = opts.auth !== false;
    // If a refresh is already running, wait for it rather than sending a token we know is stale.
    if (useAuth && refreshInFlight) await refreshInFlight.catch(() => undefined);
    const usedToken = useAuth ? await deps.storage.getAccessToken() : null;
    let res = await send(method, path, opts, usedToken);

    if (res.status === 401 && useAuth) {
      // Another request may have refreshed already while ours was in flight: reuse that token.
      const current = await deps.storage.getAccessToken();
      const fresh = current && current !== usedToken ? current : await refreshTokens();
      res = await send(method, path, opts, fresh);
    }

    if (!res.ok) throw await toApiError(res);
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  return {
    request,
    get: (path, opts) => request('GET', path, opts),
    post: (path, body, opts) => request('POST', path, { ...opts, body }),
    refreshTokens,
  };
}
