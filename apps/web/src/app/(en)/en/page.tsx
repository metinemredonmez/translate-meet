import { HomeView } from "@/components/HomeView";
import { SiteShell } from "@/components/SiteShell";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("en", "home");

export default function Page() {
  return (
    <SiteShell locale="en" page="home">
      <HomeView locale="en" />
    </SiteShell>
  );
}
