import "@translate-meet/shared/tokens.css";
import "./globals.css";
import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import { LOCALES, pathFor } from "@/lib/routes";
import { BRAND } from "@/lib/site";

/**
 * 404 for every unmatched URL (the app has two root layouts, so there is no single layout to
 * build a 404 from). The URL may belong to either language, so the page speaks both.
 * Next.js adds `noindex` to 404 responses automatically.
 */
export const metadata: Metadata = {
  title: `${getDictionary("tr").notFound.metaTitle} / ${getDictionary("en").notFound.metaTitle} · ${BRAND}`,
};

export default function GlobalNotFound() {
  return (
    <html lang="tr">
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-10 px-4 py-16 sm:px-6">
          <p className="text-6xl font-bold tracking-tight text-primary" aria-hidden="true">
            404
          </p>
          {LOCALES.map((locale, i) => {
            const t = getDictionary(locale).notFound;
            const Heading = i === 0 ? "h1" : "h2";
            return (
              <section key={locale} lang={locale} className="rounded-2xl border border-border bg-surface p-6">
                <Heading className="text-2xl font-bold text-foreground">{t.title}</Heading>
                <p className="mt-2 text-muted">{t.body}</p>
                <p className="mt-4">
                  <a href={pathFor("home", locale)} className="font-semibold text-primary underline underline-offset-4">
                    {t.home}
                  </a>
                </p>
              </section>
            );
          })}
        </main>
      </body>
    </html>
  );
}
