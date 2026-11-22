import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import type { ReactNode } from "react";
import "@translate-meet/shared/tokens.css";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: { default: "Translate Meet Panel", template: "%s · Translate Meet Panel" },
  description: "Translate Meet admin panel",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  referrer: "no-referrer",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Every page is rendered per request so Next.js can stamp the CSP nonce from src/proxy.ts.
  await connection();
  return (
    <html lang="tr">
      <body className="min-h-dvh bg-background text-fg antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
