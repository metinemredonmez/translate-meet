// Colors: shared design tokens (CSS variables), mapped to Tailwind in globals.css.
import "@translate-meet/shared/tokens.css";
import "../globals.css";
import type { ReactNode } from "react";
import { RootDocument, rootMetadata, rootViewport } from "@/components/RootDocument";

// No cookie banner on purpose: the site sets no non-essential cookies and loads no analytics.
// If analytics is ever added, add the consent banner from the design kit (web/09) first.
export const metadata = rootMetadata("tr");
export const viewport = rootViewport;

export default function TrRootLayout({ children }: { children: ReactNode }) {
  return <RootDocument locale="tr">{children}</RootDocument>;
}
