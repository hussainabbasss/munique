import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/helpers";
import { instituteLabel } from "@/lib/admin/institute";
import {
  WaiverSheets,
  type WaiverCommittee,
} from "@/components/admin/waiver-sheets";
import "../roll-call/roll-call.css";
import "./waivers.css";

type Props = {
  searchParams: Promise<{ committee?: string }>;
};

type AllotmentRow = {
  committee_id: string;
  delegates: {
    full_name: string;
    email: string | null;
    phone: string | null;
  } | null;
  registrations: {
    registration_id: string;
    school: string;
    source: string;
  } | null;
};

const PAGE = 1000;

export default async function WaiversPage({ searchParams }: Props) {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login?next=/admin/waivers");

  const params = await searchParams;
  const supabase = await createClient();

  const { data: committees } = await supabase
    .from("committees")
    .select("id, name")
    .eq("is_published", true)
    .order("display_order");

  // Pending and issued alike — every seat that has someone in it
  const allotments: AllotmentRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data } = await supabase
      .from("allotments")
      .select(
        "committee_id, delegates(full_name, email, phone), registrations(registration_id, school, source)",
      )
      .not("country", "is", null)
      .not("committee_id", "is", null)
      .order("id")
      .range(from, from + PAGE - 1);
    allotments.push(...((data ?? []) as unknown as AllotmentRow[]));
    if (!data || data.length < PAGE) break;
  }

  const sheets: WaiverCommittee[] = (committees ?? []).map((committee) => ({
    id: committee.id,
    name: committee.name,
    rows: allotments
      .filter((row) => row.committee_id === committee.id && row.delegates)
      .map((row) => ({
        code: row.registrations?.registration_id ?? "",
        name: row.delegates!.full_name.trim(),
        phone: row.delegates!.phone ?? "",
        email: row.delegates!.email ?? "",
        committee: committee.name,
        institute: instituteLabel(
          row.registrations?.source,
          row.registrations?.school,
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));

  return (
    <WaiverSheets
      committees={sheets}
      initialCommitteeId={params.committee ?? "all"}
    />
  );
}
