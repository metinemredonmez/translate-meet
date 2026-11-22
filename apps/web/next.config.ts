import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy (red-team WEB-02, WEB-04).
 *
 * The site is fully static (no nonce is possible without dynamic rendering), and Next.js
 * hydrates with inline `self.__next_f.push(...)` scripts, so `'unsafe-inline'` is required in
 * `script-src`. There are no third-party scripts, fonts, frames or trackers; every other source
 * is `'self'`. JSON-LD (`type="application/ld+json"`) is data, not executed script.
 * `'unsafe-eval'` is only added in development (React dev tooling needs it).
 */
export function contentSecurityPolicy(dev: boolean = isDev): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function securityHeaders(dev: boolean = isDev): { key: string; value: string }[] {
  const headers = [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(dev) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    // Legacy browsers that ignore CSP frame-ancestors.
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
  if (!dev) {
    // WEB-04: HSTS opened gradually — no includeSubDomains/preload until every subdomain is verified on HTTPS.
    headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000" });
  }
  return headers;
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // Two root layouts (TR at "/", EN at "/en") so each page gets the right <html lang>;
    // unmatched URLs are served by app/global-not-found.tsx.
    globalNotFound: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders() }];
  },
};

export default nextConfig;
