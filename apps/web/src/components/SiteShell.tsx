import Link from "next/link";
import type { ReactNode } from "react";
import { format, getDictionary } from "@/i18n";
import { homeAnchor, LEGAL_PAGE_IDS, otherLocale, pathFor, type Locale, type PageId } from "@/lib/routes";
import { Icon } from "./icons";

/**
 * Page chrome shared by every page: skip link, header (brand, nav, language switch),
 * <main id="main"> and footer. Server component, no client JS.
 */
export function SiteShell({ locale, page, children }: { locale: Locale; page: PageId; children: ReactNode }) {
  const d = getDictionary(locale);
  const alt = otherLocale(locale);

  const nav = [
    { href: homeAnchor(locale, "features"), label: d.nav.features },
    { href: homeAnchor(locale, "how"), label: d.nav.how },
    { href: homeAnchor(locale, "data"), label: d.nav.data },
  ];

  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {d.common.skipToContent}
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href={pathFor("home", locale)}
            className="flex items-center gap-2 rounded-md font-semibold tracking-tight text-foreground"
            aria-label={d.common.homeLink}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary">
              <Icon name="converse" className="h-5 w-5" />
            </span>
            <span>{d.meta.siteName}</span>
          </Link>

          <nav aria-label={d.common.primaryNav} className="flex items-center gap-1 text-sm">
            <ul className="hidden items-center gap-1 md:flex">
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="rounded-md px-3 py-2 text-muted hover:text-foreground">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <Link
              href={pathFor("faq", locale)}
              className="rounded-md px-3 py-2 text-muted hover:text-foreground"
              aria-current={page === "faq" ? "page" : undefined}
            >
              {d.nav.faq}
            </Link>
            <a
              href={pathFor(page, alt)}
              hrefLang={alt}
              lang={alt}
              title={d.common.switchLanguageLabel}
              className="ml-1 rounded-full border border-border px-3 py-1.5 font-medium text-foreground hover:bg-surface"
            >
              {d.common.switchLanguage}
            </a>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="focus:outline-none">
        {children}
      </main>

      <footer className="mt-24 border-t border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
          <div>
            <p className="font-semibold text-foreground">{d.meta.siteName}</p>
            <p className="mt-2 text-sm text-muted">{d.footer.tagline}</p>
            <p className="mt-4 text-sm text-muted">{d.footer.noTracking}</p>
          </div>
          <nav aria-labelledby="footer-product">
            <h2 id="footer-product" className="text-sm font-semibold text-foreground">
              {d.footer.productHeading}
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href={homeAnchor(locale, "features")} className="text-muted underline-offset-4 hover:text-foreground hover:underline">
                  {d.nav.features}
                </a>
              </li>
              <li>
                <a href={homeAnchor(locale, "data")} className="text-muted underline-offset-4 hover:text-foreground hover:underline">
                  {d.nav.data}
                </a>
              </li>
              <li>
                <Link href={pathFor("faq", locale)} className="text-muted underline-offset-4 hover:text-foreground hover:underline">
                  {d.faq.title}
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-labelledby="footer-legal">
            <h2 id="footer-legal" className="text-sm font-semibold text-foreground">
              {d.footer.legalHeading}
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {LEGAL_PAGE_IDS.map((id) => (
                <li key={id}>
                  <Link
                    href={pathFor(id, locale)}
                    className="text-muted underline-offset-4 hover:text-foreground hover:underline"
                    aria-current={page === id ? "page" : undefined}
                  >
                    {d.legal.docs[id].navLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="border-t border-border">
          <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted sm:px-6">
            {format(d.footer.rights, { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </>
  );
}
