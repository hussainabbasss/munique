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
        Names, roles, and portraits shown on the homepage and{" "}
        <code>/secretariat</code> page.
      </p>
      <SecretariatManager members={data ?? []} portraitUrls={portraitUrls} />
    </section>
  );
}
