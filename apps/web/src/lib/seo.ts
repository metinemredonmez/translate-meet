import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import { LOCALES, ROUTES, type Locale, type PageId } from "./routes";
import { BRAND } from "./site";

function titleAndDescription(locale: Locale, page: PageId): { title: string; description: string } {
  const d = getDictionary(locale);
  switch (page) {
    case "home":
      return { title: d.home.metaTitle, description: d.home.metaDescription };
    case "faq":
      return { title: d.faq.metaTitle, description: d.faq.metaDescription };
    default: {
      const doc = d.legal.docs[page];
      return { title: doc.metaTitle, description: doc.metaDescription };
    }
  }
}

/** hreflang map for a page: tr, en and x-default (TR is the default language). */
export function languageAlternates(page: PageId): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = ROUTES[page][l];
  languages["x-default"] = ROUTES[page].tr;
  return languages;
}

/**
 * Per-page metadata: own canonical, hreflang alternates, Open Graph and Twitter card.
 * Every page sets its own og:url/title so shared links never inherit the home page's values.
 * Open Graph is text-only on purpose (no image).
 */
export function pageMetadata(locale: Locale, page: PageId): Metadata {
  const d = getDictionary(locale);
  const { title, description } = titleAndDescription(locale, page);
  const path = ROUTES[page][locale];
  const shareTitle = page === "home" ? title : `${title} · ${BRAND}`;

  return {
    title: page === "home" ? { absolute: title } : title,
    description,
    alternates: { canonical: path, languages: languageAlternates(page) },
    openGraph: {
      type: "website",
      url: path,
      siteName: BRAND,
      locale: d.meta.ogLocale,
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => getDictionary(l).meta.ogLocale),
      title: shareTitle,
      description,
    },
    twitter: { card: "summary", title: shareTitle, description },
  };
}
