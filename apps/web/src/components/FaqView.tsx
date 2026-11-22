import Link from "next/link";
import { getDictionary } from "@/i18n";
import { buildFaqJsonLd } from "@/lib/jsonld";
import { pathFor, ROUTES, type LegalPageId, type Locale } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";
import { FaqList } from "./FaqList";
import { JsonLd } from "./JsonLd";

/** FAQ answers that point to a fuller page. */
const RELATED: Record<string, LegalPageId> = {
  where: "kvkk",
  audio: "privacy",
  delete: "deletion",
};

export function FaqView({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);
  const jsonLd = buildFaqJsonLd(d.faq.items, { inLanguage: locale, url: absoluteUrl(ROUTES.faq[locale]) });

  return (
    <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6 md:pt-16">
      <JsonLd data={jsonLd} />
      <h1 className="text-4xl font-bold tracking-tight text-foreground">{d.faq.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">{d.faq.lead}</p>
      <FaqList
        className="mt-10"
        items={d.faq.items}
        renderExtra={(id) => {
          const page = RELATED[id];
          if (!page) return null;
          return (
            <p className="mt-3 text-sm">
              <span className="text-muted">{d.faq.relatedLink}: </span>
              <Link href={pathFor(page, locale)} className="font-semibold text-primary underline underline-offset-4">
                {d.legal.docs[page].navLabel}
              </Link>
            </p>
          );
        }}
      />
    </div>
  );
}
