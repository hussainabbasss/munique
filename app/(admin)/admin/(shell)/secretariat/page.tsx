import { createClient } from "@/lib/supabase/server";
import { SecretariatManager } from "@/components/admin/secretariat-manager";
import { getPublicStorageUrl } from "@/lib/public/queries";
import { requireAdminUser } from "@/lib/admin/helpers";

export default async function SecretariatAdminPage() {
  await requireAdminUser();

  const supabase = await createClient();
  const { data } = await supabase
    .from("secretariat_members")
    .select("*")
    .order("display_order");
  const { data: committees } = await supabase
    .from("committees")
    .select("id,name")
    .order("display_order");

  const portraitUrls: Record<string, string | null> = {};
  for (const member of data ?? []) {
    portraitUrls[member.id] = member.portrait_path
      ? getPublicStorageUrl("secretariat-portraits", member.portrait_path)
      : null;
  }

  return (
    <section className="admin-panel">
      <h1 className="admin-panel-title">Secretariat</h1>
      <p className="admin-panel-lead">
        Chairs with portraits, committee assignment, and bios shown on{" "}
        <code>/secretariat</code> and linked from <code>/committees</code>.
      </p>
      <SecretariatManager
        members={data ?? []}
        portraitUrls={portraitUrls}
        committees={committees ?? []}
      />
    </section>
  );
}
