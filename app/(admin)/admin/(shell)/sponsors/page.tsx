import { createClient } from "@/lib/supabase/server";
import { SponsorsManager } from "@/components/admin/sponsors-manager";
import { getSignedUrl } from "@/lib/admin/helpers";
import type { Sponsor } from "@/lib/types/admin";

export default async function SponsorsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sponsors")
    .select("*")
    .order("display_order");

  const logoUrls: Record<string, string | null> = {};
  for (const s of data ?? []) {
    if (s.logo_path) {
      logoUrls[s.id] = await getSignedUrl("sponsor-logos", s.logo_path);
    }
  }

  return (
    <section className="admin-panel">
      <h1 className="admin-panel-title">Sponsors &amp; Partners</h1>
      <SponsorsManager
        sponsors={(data ?? []) as Sponsor[]}
        logoUrls={logoUrls}
      />
    </section>
  );
}
