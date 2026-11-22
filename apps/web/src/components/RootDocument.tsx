import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/routes";
import { BRAND, SITE_URL } from "@/lib/site";

/** Shared <html>/<body> for the TR and EN root layouts (each route group is its own root). */
export function RootDocument({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={locale}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}

export function rootMetadata(locale: Locale): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: BRAND,
    title: { default: BRAND, template: `%s · ${BRAND}` },
    description: getDictionary(locale).meta.defaultDescription,
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const rootViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};
