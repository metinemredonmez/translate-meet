import { LegalView } from "@/components/LegalView";
import { SiteShell } from "@/components/SiteShell";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("tr", "terms");

export default function Page() {
  return (
    <SiteShell locale="tr" page="terms">
      <LegalView locale="tr" doc="terms" />
    </SiteShell>
  );
}
