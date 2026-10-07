import { createClient } from "@/lib/supabase/server";
import {
  ReferencesBoard,
  type ReferenceRegistration,
} from "@/components/admin/references-board";

export default async function ReferencesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("registrations")
    .select(
      "id, registration_id, type, school, source, payment_status, brand_ambassador_name, created_at, delegates(full_name, is_head_delegate)",
    )
    .order("created_at", { ascending: false });

  return (
    <>
      <header className="admin-page-header">
        <div className="admin-page-header-text">
          <h1 className="admin-page-title">References</h1>
          <p className="admin-page-lede">
            Who brought each registration in — split by website sign-ups and
            Google Form imports.
          </p>
        </div>
      </header>

      <ReferencesBoard
        registrations={(data ?? []) as unknown as ReferenceRegistration[]}
      />
    </>
  );
}
