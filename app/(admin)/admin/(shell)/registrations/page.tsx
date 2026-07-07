import { createClient } from "@/lib/supabase/server";
import { RegistrationsTable } from "@/components/admin/registrations-table";
import { RegistrationsStaffBoard } from "@/components/admin/registrations-staff-board";
import { getAdminUser, getSignedUrl } from "@/lib/admin/helpers";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{
    payment?: string;
    type?: string;
    q?: string;
  }>;
};

export default async function RegistrationsPage({ searchParams }: Props) {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");

  const isStaff = admin.role === "registration_staff";
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("registrations")
    .select(
      "*, delegates(full_name, email, is_head_delegate), committee_pref_1:committees!registrations_committee_pref_1_fkey(name)",
    )
    .order("created_at", { ascending: false });

  if (!isStaff && params.payment && params.payment !== "all") {
    query = query.eq("payment_status", params.payment);
  }

  if (!isStaff && params.type && params.type !== "all") {
    query = query.eq("type", params.type);
  }

  if (!isStaff && params.q) {
    query = query.or(
      `registration_id.ilike.%${params.q}%,head_email.ilike.%${params.q}%,school.ilike.%${params.q}%`,
    );
  }

  const { data } = await query;

  const paymentProofUrls: Record<string, string | null> = {};
  for (const reg of data ?? []) {
    if (reg.payment_proof_path) {
      paymentProofUrls[reg.id] = await getSignedUrl(
        "payment-proofs",
        reg.payment_proof_path,
      );
    }
  }

  return (
    <section className="admin-panel">
      <h1 className="admin-panel-title">Registrations</h1>
      {isStaff ? (
        <p className="admin-panel-lead">
          Review registrations and confirm payment when verified.
        </p>
      ) : (
        <form className="admin-filters" method="get">
          <select name="type" defaultValue={params.type ?? "all"}>
            <option value="all">All types</option>
            <option value="delegate">Delegate</option>
            <option value="delegation">Delegation</option>
          </select>
          <select name="payment" defaultValue={params.payment ?? "all"}>
            <option value="all">All payments</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
          </select>
          <input
            name="q"
            placeholder="Name or ID…"
            defaultValue={params.q ?? ""}
          />
          <button type="submit" className="btn-admin-secondary">
            Filter
          </button>
        </form>
      )}

      {isStaff ? (
        <RegistrationsStaffBoard registrations={data ?? []} />
      ) : (
        <RegistrationsTable
          registrations={data ?? []}
          paymentProofUrls={paymentProofUrls}
        />
      )}
    </section>
  );
}
