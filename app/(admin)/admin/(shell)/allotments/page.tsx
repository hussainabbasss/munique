import { createClient } from "@/lib/supabase/server";
import { AllotmentsManager } from "@/components/admin/allotments-manager";
import { getAdminUser } from "@/lib/admin/helpers";
import { countPendingAllotmentEmails } from "@/lib/allotments/pending-email";

type DelegateRow = {
  full_name: string;
  is_head_delegate: boolean;
  email: string | null;
  allotment_email_sent_at: string | null;
};

type RegistrationSummary = {
  payment_status: string;
  type: "delegate" | "delegation";
  delegates: DelegateRow[];
};

export default async function AllotmentsPage() {
  const admin = await getAdminUser();
  const supabase = await createClient();

  const [
    { data: allotments },
    { data: committees },
    { data: confirmedRegs },
  ] = await Promise.all([
    supabase
      .from("allotments")
      .select(
        "*, registrations(registration_id, payment_status, type, school, delegates(full_name, is_head_delegate, email, allotment_email_sent_at)), committees(name)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("committees")
      .select("id, name, country_pool")
      .eq("is_published", true)
      .order("display_order"),
    supabase
      .from("registrations")
      .select(
        "id, registration_id, type, school, delegates(full_name, is_head_delegate, email, allotment_email_sent_at)",
      )
      .eq("payment_status", "confirmed"),
  ]);

  const allottedRegistrationIds = new Set(
    (allotments ?? []).map((allotment) => allotment.registration_id),
  );

  const awaiting =
    confirmedRegs?.filter((reg) => !allottedRegistrationIds.has(reg.id)) ?? [];

  let pendingEmailCount = 0;
  let incompletePendingCount = 0;
  let pendingDelegateEmails = 0;
  let pendingDelegationEmails = 0;

  for (const allotment of allotments ?? []) {
    const reg = allotment.registrations as RegistrationSummary | null;
    const isPending =
      allotment.status === "pending" &&
      reg?.payment_status === "confirmed";

    if (isPending && (!allotment.country || !allotment.committee_id)) {
      incompletePendingCount++;
    }

    const emailCount = countPendingAllotmentEmails(
      reg,
      Boolean(allotment.country),
    );
    pendingEmailCount += emailCount;

    if (emailCount > 0 && reg) {
      if (reg.type === "delegation") {
        pendingDelegationEmails += emailCount;
      } else {
        pendingDelegateEmails += emailCount;
      }
    }
  }

  return (
    <section className="admin-panel">
      <h1 className="admin-panel-title">Allotments</h1>
      <p className="admin-panel-lead">
        Review AI suggestions, adjust before issuing, then send allotment emails.
      </p>
      <AllotmentsManager
        allotments={allotments ?? []}
        committees={(committees ?? []).map((committee) => ({
          ...committee,
          country_pool: committee.country_pool ?? [],
        }))}
        awaiting={awaiting}
        pendingEmailCount={pendingEmailCount}
        incompletePendingCount={incompletePendingCount}
        pendingDelegateEmails={pendingDelegateEmails}
        pendingDelegationEmails={pendingDelegationEmails}
        canIssue={admin?.role === "admin"}
      />
    </section>
  );
}
