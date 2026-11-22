import { FaqView } from "@/components/FaqView";
import { SiteShell } from "@/components/SiteShell";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("en", "faq");

export default function Page() {
  return (
    <SiteShell locale="en" page="faq">
      <FaqView locale="en" />
    </SiteShell>
  );
}
