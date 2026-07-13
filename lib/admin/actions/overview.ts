"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_REGISTRATION_MESSAGE,
  requireAdminUser,
} from "@/lib/admin/helpers";
import type {
  RegistrationStatusSettings,
  ScheduleStatusSettings,
  StatusBannerSettings,
} from "@/lib/types/admin";

export async function saveBannerAction(formData: FormData) {
  await requireAdminUser();

  const message = String(formData.get("message") ?? "").trim();
  const href = String(formData.get("href") ?? "").trim();
  const visible = formData.get("visible") === "on";

  if (visible && (message.length < 1 || message.length > 120)) {
    return { error: "Message must be 1–120 characters when visible." };
  }

  const value: StatusBannerSettings = { message, href, visible };
  const supabase = await createClient();
  const admin = await requireAdminUser();

  const { error } = await supabase.from("site_settings").upsert({
    key: "status_banner",
    value,
    updated_at: new Date().toISOString(),
    updated_by: admin.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: "Banner updated" };
}

export async function saveRegistrationStatusAction(formData: FormData) {
  const admin = await requireAdminUser();

  const enabled = formData.get("enabled") === "on";
  const message =
    String(formData.get("message") ?? "").trim() || DEFAULT_REGISTRATION_MESSAGE;

  if (message.length > 120) {
    return { error: "Message must be 120 characters or fewer." };
  }

  const value: RegistrationStatusSettings = { enabled, message };
  const supabase = await createClient();

  const { error } = await supabase.from("site_settings").upsert({
    key: "registration_status",
    value,
    updated_at: new Date().toISOString(),
    updated_by: admin.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/register");
  revalidatePath("/admin");
  return {
    success: enabled ? "Registration is now live" : "Registration disabled",
  };
}

export async function saveScheduleStatusAction(formData: FormData) {
  const admin = await requireAdminUser();

  const enabled = formData.get("enabled") === "on";

  const value: ScheduleStatusSettings = { enabled };
  const supabase = await createClient();

  const { error } = await supabase.from("site_settings").upsert({
    key: "schedule_status",
    value,
    updated_at: new Date().toISOString(),
    updated_by: admin.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/admin");
  return {
    success: enabled ? "Schedule is now live" : "Schedule set to coming soon",
  };
}

export async function exportRegistrationsCsvAction() {
  await requireAdminUser();
  const supabase = await createClient();

  const { data: registrations } = await supabase
    .from("registrations")
    .select(
      "registration_id, type, head_email, payment_status, fee_amount, created_at, school, delegates(full_name, is_head_delegate)",
    )
    .order("created_at", { ascending: false });

  const header =
    "registration_id,type,name,email,committee_pref,payment_status,fee_amount,created_at";
  const rows = (registrations ?? []).map((r) => {
    const delegates = r.delegates as
      | { full_name: string; is_head_delegate: boolean }[]
      | null;
    const head =
      delegates?.find((d) => d.is_head_delegate)?.full_name ??
      delegates?.[0]?.full_name ??
      "";
    return [
      r.registration_id,
      r.type,
      `"${head.replace(/"/g, '""')}"`,
      r.head_email,
      "",
      r.payment_status,
      r.fee_amount,
      r.created_at,
    ].join(",");
  });

  return [header, ...rows].join("\n");
}
