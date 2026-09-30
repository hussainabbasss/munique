import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/helpers";
import {
  RollCallSheets,
  type RollCallCommittee,
} from "@/components/admin/roll-call-sheets";
import "./roll-call.css";

type Props = {
  searchParams: Promise<{ committee?: string; sessions?: string }>;
};

type AllotmentRow = {
  committee_id: string;
  country: string;
  delegates: { full_name: string } | null;
};

export default async function RollCallPage({ searchParams }: Props) {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login?next=/admin/roll-call");

  const params = await searchParams;
  const supabase = await createClient();

  const [{ data: committees }, { data: allotments }] = await Promise.all([
    supabase
      .from("committees")
      .select("id, name")
      .eq("is_published", true)
      .order("display_order"),
    // Pending and issued alike — every seat that has someone in it
    supabase
      .from("allotments")
      .select("committee_id, country, delegates(full_name)")
      .not("country", "is", null)
      .not("committee_id", "is", null),
  ]);

  const byCommittee = new Map<string, Map<string, string[]>>();
  for (const row of (allotments ?? []) as unknown as AllotmentRow[]) {
    const countries = byCommittee.get(row.committee_id) ?? new Map();
    byCommittee.set(row.committee_id, countries);
    // One row per country; double delegations share it
    const key = row.country.trim().toLowerCase();
    const entry = countries.get(key) ?? [row.country.trim()];
    if (row.delegates?.full_name) entry.push(row.delegates.full_name);
    countries.set(key, entry);
  }

  const sheets: RollCallCommittee[] = (committees ?? []).map((committee) => ({
    id: committee.id,
    name: committee.name,
    rows: [...(byCommittee.get(committee.id)?.values() ?? [])]
      .map(([country, ...delegates]) => ({ country, delegates }))
      .sort((a, b) => a.country.localeCompare(b.country)),
  }));

  const sessions = Number(params.sessions);

  return (
    <RollCallSheets
      committees={sheets}
      initialCommitteeId={params.committee ?? "all"}
      initialSessions={Number.isInteger(sessions) && sessions > 0 ? sessions : 8}
    />
  );
}
