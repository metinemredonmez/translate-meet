/**
 * One place for every public page and its URL per language.
 * TR lives at the root, EN under /en with English slugs.
 */
export type Locale = "tr" | "en";
export const LOCALES: readonly Locale[] = ["tr", "en"] as const;
export const DEFAULT_LOCALE: Locale = "tr";

export const PAGE_IDS = ["home", "faq", "privacy", "terms", "kvkk", "deletion"] as const;
export type PageId = (typeof PAGE_IDS)[number];

export const LEGAL_PAGE_IDS = ["privacy", "terms", "kvkk", "deletion"] as const;
export type LegalPageId = (typeof LEGAL_PAGE_IDS)[number];

export const ROUTES: Record<PageId, Record<Locale, string>> = {
  home: { tr: "/", en: "/en" },
  faq: { tr: "/sss", en: "/en/faq" },
  privacy: { tr: "/gizlilik", en: "/en/privacy" },
  terms: { tr: "/kullanim-sartlari", en: "/en/terms" },
  kvkk: { tr: "/kvkk-aydinlatma", en: "/en/kvkk-notice" },
  deletion: { tr: "/hesap-silme", en: "/en/account-deletion" },
};

export function pathFor(page: PageId, locale: Locale): string {
  return ROUTES[page][locale];
}

export function otherLocale(locale: Locale): Locale {
  return locale === "tr" ? "en" : "tr";
}

/** In-page anchor on the home page, e.g. homeAnchor("en", "faq") -> "/en#faq". */
export function homeAnchor(locale: Locale, id: string): string {
  return `${ROUTES.home[locale]}#${id}`;
}
