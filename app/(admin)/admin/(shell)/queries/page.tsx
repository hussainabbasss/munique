import { createClient } from "@/lib/supabase/server";
import { QueriesManager } from "@/components/admin/queries-manager";
import type { QueryTicket } from "@/lib/types/admin";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function QueriesPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("queries").select("*").order("created_at", {
    ascending: false,
  });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  const { data } = await query;

  return (
    <section className="admin-panel">
      <h1 className="admin-panel-title">Queries</h1>

      <form className="admin-filters" method="get">
        <select name="status" defaultValue={params.status ?? "open"}>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="all">All</option>
        </select>
        <button type="submit" className="btn-admin-secondary">
          Filter
        </button>
      </form>

      <QueriesManager queries={(data ?? []) as QueryTicket[]} />
    </section>
  );
}
