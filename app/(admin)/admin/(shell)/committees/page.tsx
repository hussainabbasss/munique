import { createClient } from "@/lib/supabase/server";
import { CommitteesManager } from "@/components/admin/committees-manager";
import type { Committee } from "@/lib/types/admin";

export default async function CommitteesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("committees")
    .select("*")
    .order("display_order");

  return (
    <section className="admin-panel">
      <h1 className="admin-panel-title">Committees</h1>
      <CommitteesManager committees={(data ?? []) as Committee[]} />
    </section>
  );
}
