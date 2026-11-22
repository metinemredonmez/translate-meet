import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { LOCALES, PAGE_IDS, ROUTES } from "@/lib/routes";
import { absoluteUrl, SITE_URL } from "@/lib/site";

describe("sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("lists every page in both languages exactly once", () => {
    const expected = PAGE_IDS.flatMap((p) => LOCALES.map((l) => absoluteUrl(ROUTES[p][l])));
    expect(expected).toHaveLength(12);
    expect([...urls].sort()).toEqual([...expected].sort());
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("includes the TR and EN URLs of the legal pages and FAQ", () => {
    for (const path of ["/", "/sss", "/gizlilik", "/kullanim-sartlari", "/kvkk-aydinlatma", "/hesap-silme",
      "/en", "/en/faq", "/en/privacy", "/en/terms", "/en/kvkk-notice", "/en/account-deletion"]) {
      expect(urls).toContain(absoluteUrl(path));
    }
  });

  it("gives every entry tr/en hreflang alternates", () => {
    for (const e of entries) {
      const langs = e.alternates?.languages as Record<string, string>;
      expect(Object.keys(langs).sort()).toEqual(["en", "tr"]);
      expect([langs.tr, langs.en]).toContain(e.url);
    }
  });

  it("robots points at the sitemap", () => {
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});
