import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CountryMatrix } from "@/components/admin/country-matrix";
import {
  buildCountryMatrix,
  type MatrixAllotmentInput,
  type MatrixCommitteeInput,
} from "@/lib/allotments/country-matrix";
import { currentConferenceDay, marksByDelegate } from "@/lib/attendance/days";

type Props = {
  searchParams: Promise<{ attendance?: string }>;
};

export default async function CountriesPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();

  const [
    { data: committees },
    { data: allotments },
    { data: attendance },
  ] = await Promise.all([
    supabase
      .from("committees")
      .select("id, name, is_published, country_pool, allotments_paused")
      .order("display_order"),
    supabase
      .from("allotments")
      .select(
        "id, registration_id, delegate_id, committee_id, country, status, registrations(registration_id, type, school), delegates(full_name, is_head_delegate)",
      )
      .not("country", "is", null)
      .not("committee_id", "is", null),
    supabase.from("delegate_attendance").select("delegate_id, day, marked_at"),
  ]);

  const matrix = buildCountryMatrix(
    (committees ?? []) as MatrixCommitteeInput[],
    (allotments ?? []) as unknown as MatrixAllotmentInput[],
  );

  return (
    <section className="admin-panel">
      <h1 className="admin-panel-title">Country matrix</h1>
      <p className="admin-panel-lead">
        Per committee: which countries are taken, who holds them, and how many
        are still left. A country counts as taken as soon as it is set on an
        allotment — pending or issued. Turn on attendance to tick delegates
        present committee by committee.
      </p>
      <p className="admin-panel-lead">
        <Link href="/admin/roll-call" className="admin-action-chip">
          Print roll call sheets
        </Link>
      </p>
      <CountryMatrix
        committees={matrix}
        attendance={marksByDelegate(attendance)}
        initialDay={currentConferenceDay()}
        initialAttendanceOn={params.attendance === "on"}
      />
    </section>
  );
}
