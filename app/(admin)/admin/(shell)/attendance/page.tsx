import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/helpers";
import {
  AttendanceBoard,
  type AttendanceDelegate,
} from "@/components/admin/attendance-board";

type DelegateRow = {
  id: string;
  full_name: string;
  is_head_delegate: boolean;
  display_order: number;
  allotments: { country: string | null; committees: { name: string } | null }[] | null;
  delegate_attendance: { day: number; marked_at: string }[] | null;
};

// Conference days in Pakistan time — the gate opens on the matching sheet.
const DAY_2_DATE = "2026-10-18";

function todayInKarachi() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(
    new Date(),
  );
}

export default async function AttendancePage() {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");

  const supabase = await createClient();

  // Only paid registrations are expected at the gate.
  const { data: registrations } = await supabase
    .from("registrations")
    .select(
      "id, registration_id, type, school, delegates(id, full_name, is_head_delegate, display_order, allotments(country, committees(name)), delegate_attendance(day, marked_at))",
    )
    .eq("payment_status", "confirmed")
    .order("registration_id");

  const delegates: AttendanceDelegate[] = (registrations ?? []).flatMap((reg) =>
    ((reg.delegates ?? []) as unknown as DelegateRow[])
      .sort((a, b) => a.display_order - b.display_order)
      .map((delegate) => {
        const allotment = delegate.allotments?.[0];
        const marks = delegate.delegate_attendance ?? [];
        const markedAt = (day: number) =>
          marks.find((row) => row.day === day)?.marked_at ?? null;
        return {
          id: delegate.id,
          fullName: delegate.full_name,
          isHead: delegate.is_head_delegate,
          registrationId: reg.registration_id,
          type: reg.type as "delegate" | "delegation",
          school: reg.school,
          country: allotment?.country ?? null,
          committee: allotment?.committees?.name ?? null,
          day1: markedAt(1),
          day2: markedAt(2),
        };
      }),
  );

  delegates.sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <section className="admin-panel">
      <h1 className="admin-panel-title">Attendance</h1>
      <p className="admin-panel-lead">
        Gate register for confirmed delegates. Tick a box as each delegate
        walks in — tap again to undo.
      </p>
      <AttendanceBoard
        delegates={delegates}
        initialDay={todayInKarachi() >= DAY_2_DATE ? 2 : 1}
      />
    </section>
  );
}
