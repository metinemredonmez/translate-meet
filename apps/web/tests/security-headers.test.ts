import { describe, expect, it } from "vitest";
import nextConfig, { contentSecurityPolicy, securityHeaders } from "../next.config";

describe("security headers", () => {
  it("production CSP is strict and has no unsafe-eval", () => {
    const csp = contentSecurityPolicy(false);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("img-src 'self' data:");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toMatch(/https?:/); // no third-party origins
  });

  it("only development adds unsafe-eval", () => {
    expect(contentSecurityPolicy(true)).toContain("'unsafe-eval'");
  });

  it("sends nosniff, referrer and permissions policies on every path", async () => {
    const rules = await nextConfig.headers!();
    expect(rules).toHaveLength(1);
    expect(rules[0]!.source).toBe("/:path*");
    const byKey = Object.fromEntries(securityHeaders(false).map((h) => [h.key, h.value]));
    expect(byKey["X-Content-Type-Options"]).toBe("nosniff");
    expect(byKey["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(byKey["Permissions-Policy"]).toBe("camera=(), microphone=(), geolocation=()");
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});
