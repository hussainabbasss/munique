import { createClient } from "@/lib/supabase/server";
import { SponsorsManager } from "@/components/admin/sponsors-manager";
import { getSignedUrl } from "@/lib/admin/helpers";
import { getSponsorLogoUrl } from "@/lib/sponsors/logo";
import type { Sponsor } from "@/lib/types/admin";

export default async function SponsorsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sponsors")
    .select("*")
    .order("display_order");

  const sponsors = (data ?? []) as Sponsor[];
  const logoUrls: Record<string, string | null> = {};

  for (const sponsor of sponsors) {
    const staticLogo = getSponsorLogoUrl(sponsor);
    if (staticLogo) {
      logoUrls[sponsor.id] = staticLogo;
    } else if (sponsor.logo_path) {
      logoUrls[sponsor.id] = await getSignedUrl("sponsor-logos", sponsor.logo_path);
    }
  }

  return (
    <section className="admin-panel">
      <h1 className="admin-panel-title">Sponsors &amp; Partners</h1>
      <SponsorsManager sponsors={sponsors} logoUrls={logoUrls} />
    </section>
  );
}
