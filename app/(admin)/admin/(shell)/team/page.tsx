import { createClient } from "@/lib/supabase/server";
import { TeamManager } from "@/components/admin/team-manager";
import { getAdminUser } from "@/lib/admin/helpers";
import type { AdminUser } from "@/lib/types/admin";

export default async function TeamPage() {
  const admin = await getAdminUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at");

  return (
    <section className="admin-panel">
      <h1 className="admin-panel-title">Team</h1>
      <TeamManager
        members={(data ?? []) as AdminUser[]}
        canManage={admin?.role === "admin"}
        currentUserId={admin?.id ?? ""}
      />
    </section>
  );
}
