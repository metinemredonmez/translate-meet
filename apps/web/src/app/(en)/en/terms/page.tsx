import { LegalView } from "@/components/LegalView";
import { SiteShell } from "@/components/SiteShell";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("en", "terms");

export default function Page() {
  return (
    <SiteShell locale="en" page="terms">
      <LegalView locale="en" doc="terms" />
    </SiteShell>
  );
}
