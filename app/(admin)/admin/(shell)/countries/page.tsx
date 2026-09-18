import { createClient } from "@/lib/supabase/server";
import { CountryMatrix } from "@/components/admin/country-matrix";
import {
  buildCountryMatrix,
  type MatrixAllotmentInput,
  type MatrixCommitteeInput,
} from "@/lib/allotments/country-matrix";

export default async function CountriesPage() {
  const supabase = await createClient();

  const [{ data: committees }, { data: allotments }] = await Promise.all([
    supabase
      .from("committees")
      .select("id, name, is_published, country_pool")
      .order("display_order"),
    supabase
      .from("allotments")
      .select(
        "id, registration_id, delegate_id, committee_id, country, status, registrations(registration_id, type, school), delegates(full_name, is_head_delegate)",
      )
      .not("country", "is", null)
      .not("committee_id", "is", null),
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
        allotment — pending or issued.
      </p>
      <CountryMatrix committees={matrix} />
    </section>
  );
}
