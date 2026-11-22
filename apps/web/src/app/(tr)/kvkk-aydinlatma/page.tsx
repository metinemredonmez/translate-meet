import { LegalView } from "@/components/LegalView";
import { SiteShell } from "@/components/SiteShell";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("tr", "kvkk");

export default function Page() {
  return (
    <SiteShell locale="tr" page="kvkk">
      <LegalView locale="tr" doc="kvkk" />
    </SiteShell>
  );
}
