import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/navigation", async (orig) => ({
  ...(await orig<typeof import("@/lib/navigation")>()),
  redirectToLogin: vi.fn(),
}));

import { adminApi, readCookie } from "@/lib/api";
import { ApiError, errorKey, parseErrorBody } from "@/lib/errors";
import { redirectToLogin } from "@/lib/navigation";
import { jsonResponse, mockFetch } from "./helpers";

const stats = {
  users_total: 1, users_new_7d: 0, users_disabled: 0, translations_today: 0, translations_7d: 0,
  text_chars_today: 0, realtime_seconds_today: 0, by_provider_7d: {}, daily_7d: [],
};

beforeEach(() => {
  vi.mocked(redirectToLogin).mockClear();
});

describe("CSRF header", () => {
  it("adds x-csrf-token from the tm_csrf cookie on POST", async () => {
    document.cookie = "other=1; path=/";
    document.cookie = "tm_csrf=csrf-abc%2B123; path=/";
    const { calls } = mockFetch(() => jsonResponse(200, { id: "u1" }));
    await adminApi.enableUser("u1");
    expect(calls).toHaveLength(1);
    expect(calls[0]!.method).toBe("POST");
    expect(calls[0]!.url).toBe("/api/v1/admin/users/u1/enable");
    expect(calls[0]!.headers["x-csrf-token"]).toBe("csrf-abc+123");
  });

  it("does not send x-csrf-token on GET", async () => {
    document.cookie = "tm_csrf=csrf-abc; path=/";
    const { calls } = mockFetch(() => jsonResponse(200, stats));
    await adminApi.stats();
    expect(calls[0]!.method).toBe("GET");
    expect(calls[0]!.headers["x-csrf-token"]).toBeUndefined();
  });

  it("sends JSON body, same-origin credentials and no Authorization header", async () => {
    document.cookie = "tm_csrf=t0k; path=/";
    const fetchMock = mockFetch(() => jsonResponse(200, { id: "u1" }));
    await adminApi.disableUser("u/1", { reason: "spam hesap" });
    const call = fetchMock.calls[0]!;
    expect(call.url).toBe("/api/v1/admin/users/u%2F1/disable");
    expect(call.body).toEqual({ reason: "spam hesap" });
    expect(call.headers.authorization).toBeUndefined();
    const init = fetchMock.fn.mock.calls[0]![1] as RequestInit;
    expect(init.credentials).toBe("same-origin");
  });

  it("readCookie returns null when the cookie is missing", () => {
    expect(readCookie("tm_csrf")).toBeNull();
  });

  it("does not write anything auth-related to web storage", async () => {
    mockFetch(() => jsonResponse(200, { id: "a1", email: "a@x.io", role: "admin" }));
    await adminApi.mfa({ mfa_token: "x".repeat(30), code: "123456" });
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });
});

describe("401 handling", () => {
  it("redirects to /login on 401 from a normal request", async () => {
    mockFetch(() => jsonResponse(401, { error: { code: "unauthorized", message: "admin session required" } }));
    await expect(adminApi.stats()).rejects.toMatchObject({ status: 401, code: "unauthorized" });
    expect(redirectToLogin).toHaveBeenCalledTimes(1);
  });

  it("does not redirect on 401 from the login step (wrong credentials)", async () => {
    mockFetch(() => jsonResponse(401, { error: { code: "unauthorized", message: "invalid credentials" } }));
    await expect(adminApi.login({ email: "a@x.io", password: "nope" })).rejects.toBeInstanceOf(ApiError);
    expect(redirectToLogin).not.toHaveBeenCalled();
  });

  it("does not redirect on 403", async () => {
    mockFetch(() => jsonResponse(403, { error: { code: "forbidden", message: "admin role required" } }));
    await expect(adminApi.checkProviders()).rejects.toMatchObject({ status: 403 });
    expect(redirectToLogin).not.toHaveBeenCalled();
  });
});

describe("error shape", () => {
  it("parses {error:{code,message}}", async () => {
    mockFetch(() => jsonResponse(429, { error: { code: "rate_limited", message: "try again in a few seconds" } }));
    const err = await adminApi.checkProviders().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 429, code: "rate_limited", message: "try again in a few seconds" });
    expect(errorKey(err)).toBe("errors.rateLimited");
  });

  it("falls back when the body is not the error shape", async () => {
    mockFetch(() => new Response("<html>bad gateway</html>", { status: 502 }));
    const err = await adminApi.stats().catch((e: unknown) => e);
    expect(err).toMatchObject({ status: 502, code: "error" });
    expect(errorKey(err)).toBe("errors.server");
  });

  it("maps a network failure to status 0", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    const err = await adminApi.stats().catch((e: unknown) => e);
    expect(err).toMatchObject({ status: 0, code: "network" });
    expect(errorKey(err)).toBe("errors.network");
  });

  it("parseErrorBody rejects malformed input", () => {
    expect(parseErrorBody(null)).toBeNull();
    expect(parseErrorBody({ detail: "x" })).toBeNull();
    expect(parseErrorBody({ error: { message: "no code" } })).toBeNull();
    expect(parseErrorBody({ error: { code: "not_found", message: 5 } })).toEqual({ code: "not_found", message: "" });
  });

  it("maps status codes to human error keys", () => {
    expect(errorKey(new ApiError(404, "not_found", ""))).toBe("errors.notFound");
    expect(errorKey(new ApiError(403, "forbidden", ""))).toBe("errors.forbidden");
    expect(errorKey(new ApiError(422, "validation_error", ""))).toBe("errors.validation");
    expect(errorKey(new Error("raw"))).toBe("errors.generic");
  });

  it("returns null for 204 responses", async () => {
    mockFetch(() => jsonResponse(204, null));
    await expect(adminApi.logout()).resolves.toBeNull();
  });
});

describe("query strings", () => {
  it("omits empty query values", async () => {
    const { calls } = mockFetch(() => jsonResponse(200, { items: [], total: 0, page: 1, page_size: 25 }));
    await adminApi.users({ q: "", page: 2, page_size: 25 });
    expect(calls[0]!.url).toBe("/api/v1/admin/users?page=2&page_size=25");
  });
});
