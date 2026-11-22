import Link from "next/link";
import { format, getDictionary } from "@/i18n";
import type { LegalSection } from "@/i18n/tr";
import { LEGAL_PAGE_IDS, pathFor, type LegalPageId, type Locale } from "@/lib/routes";
import { LEGAL_DRAFT_DATE } from "@/lib/site";
import { Icon } from "./icons";

/** Visible draft notice; every legal page renders it first, above the title. */
export function DraftBanner({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);
  return (
    <div role="note" className="flex gap-3 rounded-xl border-2 border-warning bg-warning/10 p-4">
      <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
      <div>
        <p className="font-bold tracking-wide text-foreground">{d.legal.draftBanner}</p>
        <p className="mt-1 text-sm leading-relaxed text-foreground">{d.legal.draftNote}</p>
      </div>
    </div>
  );
}

/**
 * Legal reading layout (adapted from the kit's legal document viewer): eyebrow, title,
 * draft date, table of contents and numbered sections. Text is plain dictionary strings
 * rendered as React text nodes — no HTML injection.
 */
export function LegalView({ locale, doc }: { locale: Locale; doc: LegalPageId }) {
  const d = getDictionary(locale);
  const content = d.legal.docs[doc];
  const sections: readonly LegalSection[] = content.sections;
  const sectionId = (i: number) => `bolum-${i + 1}`;

  return (
    <article className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 md:pt-12">
      <DraftBanner locale={locale} />

      <header className="mt-8">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">{d.legal.eyebrow}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">{content.title}</h1>
        <p className="mt-2 text-sm text-muted">{format(d.legal.draftDate, { date: LEGAL_DRAFT_DATE })}</p>
        <p className="mt-6 text-lg leading-relaxed text-foreground">{content.intro}</p>
      </header>

      <nav aria-labelledby="toc-title" className="mt-8 rounded-xl border border-border bg-surface p-5">
        <h2 id="toc-title" className="text-sm font-semibold text-foreground">
          {d.legal.toc}
        </h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm marker:text-muted">
          {sections.map((s, i) => (
            <li key={s.heading}>
              <a href={`#${sectionId(i)}`} className="text-primary underline-offset-4 hover:underline">
                {s.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 space-y-10 text-[15px] leading-7 text-foreground">
        {sections.map((s, i) => (
          <section key={s.heading} aria-labelledby={sectionId(i)}>
            <h2 id={sectionId(i)} className="text-xl font-semibold text-foreground">
              <span className="mr-2 text-muted">{i + 1}.</span>
              {s.heading}
            </h2>
            {s.paragraphs?.map((p) => (
              <p key={p} className="mt-3">
                {p}
              </p>
            ))}
            {s.items && s.ordered ? (
              <ol className="mt-3 list-decimal space-y-2 pl-5 marker:text-muted">
                {s.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            ) : null}
            {s.items && !s.ordered ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-muted">
                {s.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <nav aria-labelledby="other-docs" className="mt-14 border-t border-border pt-6">
        <h2 id="other-docs" className="text-sm font-semibold text-foreground">
          {d.legal.otherDocs}
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {LEGAL_PAGE_IDS.filter((id) => id !== doc).map((id) => (
            <li key={id}>
              <Link
                href={pathFor(id, locale)}
                className="inline-block rounded-full border border-border px-3 py-1.5 text-foreground hover:bg-surface"
              >
                {d.legal.docs[id].navLabel}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  );
}
