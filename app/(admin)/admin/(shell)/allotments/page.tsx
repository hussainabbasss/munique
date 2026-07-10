import { createClient } from "@/lib/supabase/server";
import { AllotmentsManager } from "@/components/admin/allotments-manager";
import { getAdminUser } from "@/lib/admin/helpers";
import { countPendingAllotmentEmails } from "@/lib/allotments/pending-email";

export default async function AllotmentsPage() {
  const admin = await getAdminUser();
  const supabase = await createClient();

  const [{ data: allotments }, { data: committees }] = await Promise.all([
    supabase
      .from("allotments")
      .select(
        "*, registrations(registration_id, payment_status, type, school, delegates(full_name, is_head_delegate, email, allotment_email_sent_at)), committees(name)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("committees")
      .select("id, name")
      .eq("is_published", true)
      .order("display_order"),
  ]);

  const pendingEmailCount =
    allotments?.reduce((count, allotment) => {
      const reg = allotment.registrations as {
        payment_status: string;
        type: "delegate" | "delegation";
        delegates: {
          email: string | null;
          is_head_delegate: boolean;
          allotment_email_sent_at: string | null;
        }[];
      } | null;

      return (
        count +
        countPendingAllotmentEmails(reg, Boolean(allotment.country))
      );
    }, 0) ?? 0;

  return (
    <section className="admin-panel">
      <h1 className="admin-panel-title">Allotments</h1>
      <AllotmentsManager
        allotments={allotments ?? []}
        committees={committees ?? []}
        pendingEmailCount={pendingEmailCount}
        canIssue={admin?.role === "admin"}
      />
    </section>
  );
}
