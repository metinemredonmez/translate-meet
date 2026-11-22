import Link from "next/link";
import { getDictionary } from "@/i18n";
import { pathFor, type Locale } from "@/lib/routes";
import { FaqList } from "./FaqList";
import { Icon } from "./icons";
import { PhoneMockup } from "./PhoneMockup";
import { StoreBadges } from "./StoreBadges";

const FAQ_PREVIEW_IDS = ["what", "audio", "where", "interpreter"];

export function HomeView({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);
  const h = d.home;

  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-12 pb-16 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:pt-20 md:pb-24">
          <div>
            <p className="text-sm font-semibold tracking-wide text-primary">{h.hero.eyebrow}</p>
            <h1 id="hero-title" className="mt-3 text-4xl leading-tight font-bold tracking-tight text-balance text-foreground sm:text-5xl">
              {h.hero.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">{h.hero.lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-on-primary shadow-sm hover:opacity-90"
              >
                {h.hero.ctaPrimary}
                <Icon name="arrow" className="h-4 w-4" />
              </a>
              <a
                href="#data"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-5 py-3 font-semibold text-foreground hover:bg-surface"
              >
                <Icon name="shield" className="h-4 w-4" />
                {h.hero.ctaSecondary}
              </a>
            </div>
            <p className="mt-6 text-sm text-muted">{h.hero.storeNote}</p>
          </div>
          <PhoneMockup m={h.mockup} className="mx-auto w-64 sm:w-72" />
        </div>
      </section>

      {/* Features */}
      <section id="features" aria-labelledby="features-title" className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <SectionHeading id="features-title" title={h.features.title} lead={h.features.lead} />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {h.features.items.map((f) => {
              const soon = f.status === "soon";
              return (
                <li
                  key={f.id}
                  className="relative flex flex-col rounded-2xl border border-border bg-surface-raised p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-primary ring-1 ring-border">
                      <Icon name={f.id} />
                    </span>
                    <span
                      className={
                        soon
                          ? "rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted"
                          : "rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-on-primary"
                      }
                    >
                      {soon ? d.common.comingSoon : d.common.firstRelease}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how" aria-labelledby="how-title">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <SectionHeading id="how-title" title={h.how.title} lead={h.how.lead} />
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {h.how.steps.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-border bg-surface p-6">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-on-primary"
                >
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Your data */}
      <section id="data" aria-labelledby="data-title" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <SectionHeading id="data-title" title={h.data.title} lead={h.data.lead} />
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {h.data.points.map((p) => (
              <li key={p.title} className="flex gap-4 rounded-2xl border border-border bg-surface-raised p-6">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-success ring-1 ring-border">
                  <Icon name="shield" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">{p.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-8">
            <Link
              href={pathFor("privacy", locale)}
              className="inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-4"
            >
              {h.data.cta}
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </p>
        </div>
      </section>

      {/* Download */}
      <section id="download" aria-labelledby="download-title">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 md:py-20">
          <h2 id="download-title" className="text-3xl font-bold tracking-tight text-foreground">
            {h.download.title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">{h.download.lead}</p>
          <StoreBadges
            className="mt-8 justify-center"
            label={h.download.listLabel}
            stores={[h.download.appStore, h.download.googlePlay]}
            soon={d.common.comingSoon}
          />
        </div>
      </section>

      {/* FAQ preview */}
      <section id="faq" aria-labelledby="faq-preview-title" className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-20">
          <h2 id="faq-preview-title" className="text-3xl font-bold tracking-tight text-foreground">
            {h.faqPreview.title}
          </h2>
          <FaqList className="mt-8" items={d.faq.items.filter((item) => FAQ_PREVIEW_IDS.includes(item.id))} headingLevel={3} />
          <p className="mt-8">
            <Link
              href={pathFor("faq", locale)}
              className="inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-4"
            >
              {h.faqPreview.more}
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}

function SectionHeading({ id, title, lead }: { id: string; title: string; lead: string }) {
  return (
    <div className="max-w-2xl">
      <h2 id={id} className="text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-3 text-lg leading-relaxed text-muted">{lead}</p>
    </div>
  );
}
