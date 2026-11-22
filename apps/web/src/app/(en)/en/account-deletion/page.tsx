import { LegalView } from "@/components/LegalView";
import { SiteShell } from "@/components/SiteShell";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("en", "deletion");

export default function Page() {
  return (
    <SiteShell locale="en" page="deletion">
      <LegalView locale="en" doc="deletion" />
    </SiteShell>
  );
}
