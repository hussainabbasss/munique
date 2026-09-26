"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin/helpers";

export async function setAttendanceAction(
  delegateId: string,
  day: number,
  present: boolean,
): Promise<{ error?: string; markedAt?: string | null }> {
  const admin = await requireAdminUser();

  if (!delegateId || (day !== 1 && day !== 2)) {
    return { error: "Invalid delegate or day." };
  }

  const supabase = await createClient();
  const markedAt = new Date().toISOString();

  const { error } = present
    ? await supabase.from("delegate_attendance").upsert(
        {
          delegate_id: delegateId,
          day,
          marked_at: markedAt,
          marked_by: admin.id,
        },
        { onConflict: "delegate_id,day" },
      )
    : await supabase
        .from("delegate_attendance")
        .delete()
        .eq("delegate_id", delegateId)
        .eq("day", day);

  if (error) return { error: error.message };

  revalidatePath("/admin/attendance");
  return { markedAt: present ? markedAt : null };
}
