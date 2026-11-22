import { LegalView } from "@/components/LegalView";
import { SiteShell } from "@/components/SiteShell";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("tr", "deletion");

export default function Page() {
  return (
    <SiteShell locale="tr" page="deletion">
      <LegalView locale="tr" doc="deletion" />
    </SiteShell>
  );
}
