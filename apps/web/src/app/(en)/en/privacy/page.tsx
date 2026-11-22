import { LegalView } from "@/components/LegalView";
import { SiteShell } from "@/components/SiteShell";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("en", "privacy");

export default function Page() {
  return (
    <SiteShell locale="en" page="privacy">
      <LegalView locale="en" doc="privacy" />
    </SiteShell>
  );
}
