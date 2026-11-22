import { describe, expect, it } from "vitest";
import { buildCsp, newNonce } from "@/lib/csp";

describe("CSP", () => {
  it("is strict in production", () => {
    const csp = buildCsp("abc", false);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    for (const d of ["style-src 'self' 'unsafe-inline'", "img-src 'self' data:", "connect-src 'self'", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'"]) {
      expect(csp).toContain(d);
    }
  });

  it("allows eval only in development", () => {
    expect(buildCsp("abc", true)).toContain("'unsafe-eval'");
  });

  it("generates a fresh nonce each time", () => {
    const a = newNonce();
    expect(a).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(newNonce()).not.toBe(a);
  });
});
