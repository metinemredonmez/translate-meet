import type { NextConfig } from "next";

const API_URL = (process.env.API_URL ?? "http://localhost:8000").replace(/\/+$/, "");
const isProd = process.env.NODE_ENV === "production";

/**
 * Static security headers for every response (WEB-04). The Content-Security-Policy itself
 * is set per request with a nonce in src/proxy.ts (see src/lib/csp.ts for why).
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    // Same origin: the browser only talks to the panel, so tm_admin / tm_csrf stay first-party.
    return [{ source: "/api/:path*", destination: `${API_URL}/:path*` }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
