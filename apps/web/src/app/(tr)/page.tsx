import { HomeView } from "@/components/HomeView";
import { SiteShell } from "@/components/SiteShell";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("tr", "home");

export default function Page() {
  return (
    <SiteShell locale="tr" page="home">
      <HomeView locale="tr" />
    </SiteShell>
  );
}
