import type { MetadataRoute } from "next";
import { LOCALES, PAGE_IDS, ROUTES } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";

/**
 * Every page in both languages, each with its hreflang alternates.
 * No `lastModified`: there is no trustworthy per-page change date, and a fake "now" on every
 * build is ignored by crawlers anyway.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGE_IDS.flatMap((page) =>
    LOCALES.map((locale) => ({
      url: absoluteUrl(ROUTES[page][locale]),
      changeFrequency: page === "home" || page === "faq" ? ("monthly" as const) : ("yearly" as const),
      priority: page === "home" ? 1 : page === "faq" ? 0.8 : 0.4,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((l) => [l, absoluteUrl(ROUTES[page][l])])),
      },
    })),
  );
}
