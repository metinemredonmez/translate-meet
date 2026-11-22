import { LegalView } from "@/components/LegalView";
import { SiteShell } from "@/components/SiteShell";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("tr", "privacy");

export default function Page() {
  return (
    <SiteShell locale="tr" page="privacy">
      <LegalView locale="tr" doc="privacy" />
    </SiteShell>
  );
}
