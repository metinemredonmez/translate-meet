/** Canonical origin for sitemap, robots, canonical and hreflang URLs. No trailing slash. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002").replace(/\/+$/, "");

export const BRAND = "Translate Meet";

/** Shown on legal drafts; bump together with the legal text. */
export const LEGAL_DRAFT_DATE = "2026-11-22";

export function absoluteUrl(path: string): string {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}
