import { FaqView } from "@/components/FaqView";
import { SiteShell } from "@/components/SiteShell";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("tr", "faq");

export default function Page() {
  return (
    <SiteShell locale="tr" page="faq">
      <FaqView locale="tr" />
    </SiteShell>
  );
}
