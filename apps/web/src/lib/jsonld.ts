/**
 * JSON-LD helpers (red-team WEB-01).
 *
 * Content is serialized for an inline <script type="application/ld+json">. `<`, `>` and `&`
 * are escaped as unicode escapes so a string such as "</script>" can never close the tag, and
 * U+2028/U+2029 are escaped so the payload stays valid in every JS/HTML parser. The output is
 * still valid JSON (JSON.parse returns the original value).
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export interface FaqEntry {
  q: string;
  a: string;
}

export interface FaqPageJsonLd {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  inLanguage: string;
  url: string;
  mainEntity: {
    "@type": "Question";
    name: string;
    acceptedAnswer: { "@type": "Answer"; text: string };
  }[];
}

/** FAQPage schema built from the same dictionary entries that are rendered on the page. */
export function buildFaqJsonLd(items: readonly FaqEntry[], opts: { inLanguage: string; url: string }): FaqPageJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: opts.inLanguage,
    url: opts.url,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
