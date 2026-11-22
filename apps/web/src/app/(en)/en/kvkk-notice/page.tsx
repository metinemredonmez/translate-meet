import { LegalView } from "@/components/LegalView";
import { SiteShell } from "@/components/SiteShell";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("en", "kvkk");

export default function Page() {
  return (
    <SiteShell locale="en" page="kvkk">
      <LegalView locale="en" doc="kvkk" />
    </SiteShell>
  );
}
