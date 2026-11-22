/**
 * Content-Security-Policy for every panel page (WEB-02, WEB-04).
 *
 * The policy is built per request in `src/proxy.ts` because the App Router streams its
 * RSC payload as inline <script> tags: a static `script-src 'self'` header would block
 * hydration. Next.js reads the nonce from the request CSP header and stamps it on its own
 * scripts, so no 'unsafe-inline' is ever needed for scripts.
 */
export function buildCsp(nonce: string, isDev: boolean): string {
  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  // React uses eval only in development (error stack reconstruction).
  if (isDev) scriptSrc.push("'unsafe-eval'");
  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/** 128-bit random nonce, base64 encoded. */
export function newNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
