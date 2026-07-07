import { createClient } from "@/lib/supabase/server";
import { AllotmentsManager } from "@/components/admin/allotments-manager";
import { getAdminUser } from "@/lib/admin/helpers";

export default async function AllotmentsPage() {
  const admin = await getAdminUser();
  const supabase = await createClient();

  const [{ data: allotments }, { data: committees }] = await Promise.all([
    supabase
      .from("allotments")
      .select(
        "*, registrations(registration_id, payment_status, delegates(full_name, is_head_delegate)), committees(name)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("committees")
      .select("id, name")
      .eq("is_published", true)
      .order("display_order"),
  ]);

  const pendingCount =
    allotments?.filter((a) => {
      const reg = a.registrations as { payment_status: string } | null;
      return a.status === "pending" && reg?.payment_status === "confirmed" && a.country;
    }).length ?? 0;

  return (
    <section className="admin-panel">
      <h1 className="admin-panel-title">Allotments</h1>
      <AllotmentsManager
        allotments={allotments ?? []}
        committees={committees ?? []}
        pendingCount={pendingCount}
        canIssue={admin?.role === "admin"}
      />
    </section>
  );
}
