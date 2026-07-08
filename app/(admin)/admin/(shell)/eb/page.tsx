import { createClient } from "@/lib/supabase/server";
import { EbManager } from "@/components/admin/eb-manager";
import { getPublicStorageUrl } from "@/lib/public/queries";
import { requireAdminUser } from "@/lib/admin/helpers";

export default async function EbAdminPage() {
  await requireAdminUser();

  const supabase = await createClient();
  const { data } = await supabase.from("eb_members").select("*").order("display_order");

  const portraitUrls: Record<string, string | null> = {};
  for (const member of data ?? []) {
    portraitUrls[member.id] = member.portrait_path
      ? getPublicStorageUrl("eb-portraits", member.portrait_path)
      : null;
  }

  return (
    <section className="admin-panel">
      <h1 className="admin-panel-title">Executive Board</h1>
      <p className="admin-panel-lead">
        Manage EB profiles shown on the homepage reveal and <code>/eb</code> page.
      </p>
      <EbManager members={data ?? []} portraitUrls={portraitUrls} />
    </section>
  );
}
