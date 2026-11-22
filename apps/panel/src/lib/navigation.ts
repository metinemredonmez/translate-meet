/** Browser navigation helpers, kept in one module so tests can mock them. */

/**
 * Only same-origin relative paths are accepted as a post-login target (EXT: no open redirect).
 * "//evil.com", "/\\evil.com", absolute URLs and anything odd fall back to "/".
 */
export function safeNext(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  if (/[\u0000-\u001f\\]/.test(raw)) return "/";
  if (raw === "/login" || raw.startsWith("/login?") || raw.startsWith("/login/")) return "/";
  return raw;
}

/** Hard navigation to the login page (drops all in-memory state). */
export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  if (pathname === "/login") return;
  const next = safeNext(pathname + search);
  window.location.assign(next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`);
}
