"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendAllotmentIssued } from "@/lib/email/send";
import { requireAdminRole, requireAdminUser } from "@/lib/admin/helpers";

/** Simple merit scoring placeholder — replace with Gemini when API key is set. */
function computeMeritScore(munExperience: string, difficultyPref: string) {
  const base = Math.min(100, 40 + munExperience.length / 4);
  const tierBonus =
    difficultyPref === "high" ? 15 : difficultyPref === "medium" ? 8 : 0;
  return Math.round(Math.min(100, base + tierBonus));
}

const COUNTRIES = [
  "France",
  "USA",
  "Germany",
  "Japan",
  "Brazil",
  "Pakistan",
  "India",
  "UK",
  "China",
  "South Africa",
];

export async function runMeritEngineAction() {
  await requireAdminUser();
  const supabase = await createClient();

  const { data: confirmed } = await supabase
    .from("registrations")
    .select(
      "id, mun_experience, committee_pref_1, committees!registrations_committee_pref_1_fkey(difficulty_tier)",
    )
    .eq("payment_status", "confirmed");

  const { data: publishedCommittees } = await supabase
    .from("committees")
    .select("id, name, difficulty_tier")
    .eq("is_published", true)
    .order("display_order");

  if (!confirmed?.length) {
    return { error: "No confirmed registrations to score." };
  }

  let processed = 0;

  for (const reg of confirmed) {
    const committee = reg.committees as unknown as {
      difficulty_tier: string;
    } | null;
    const meritScore = computeMeritScore(
      reg.mun_experience,
      committee?.difficulty_tier ?? "medium",
    );
    const suggestedCommittee =
      publishedCommittees?.[processed % (publishedCommittees.length || 1)];
    const country = COUNTRIES[processed % COUNTRIES.length];

    await supabase.from("allotments").upsert(
      {
        registration_id: reg.id,
        merit_score: meritScore,
        country,
        committee_id: suggestedCommittee?.id ?? null,
        status: "pending",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "registration_id" },
    );

    processed++;
  }

  revalidatePath("/admin/allotments");
  return { success: `Merit engine scored ${processed} registrations.` };
}

export async function saveAllotmentOverrideAction(formData: FormData) {
  await requireAdminUser();

  const registrationId = String(formData.get("registration_id") ?? "");
  const country = String(formData.get("country") ?? "").trim();
  const committeeId = String(formData.get("committee_id") ?? "") || null;
  const overrideNote = String(formData.get("override_note") ?? "") || null;

  const supabase = await createClient();
  const { error } = await supabase.from("allotments").upsert(
    {
      registration_id: registrationId,
      country,
      committee_id: committeeId,
      is_override: true,
      override_note: overrideNote,
      status: "pending",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "registration_id" },
  );

  if (error) return { error: error.message };

  revalidatePath("/admin/allotments");
  return { success: "Allotment updated" };
}

export async function issueAllotmentsAction() {
  const admin = await requireAdminRole();
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from("allotments")
    .select(
      "id, registration_id, country, status, registrations(payment_status, registration_id), committees(name)",
    )
    .eq("status", "pending");

  const eligible =
    pending?.filter((a) => {
      const reg = a.registrations as unknown as {
        payment_status: string;
      } | null;
      return reg?.payment_status === "confirmed" && a.country;
    }) ?? [];

  if (!eligible.length) {
    return { error: "No pending allotments ready to issue." };
  }

  const now = new Date().toISOString();
  let emailsSent = 0;

  for (const allotment of eligible) {
    const committee = allotment.committees as unknown as { name: string } | null;

    const { data: delegates } = await supabase
      .from("delegates")
      .select("email, full_name")
      .eq("registration_id", allotment.registration_id);

    await supabase
      .from("allotments")
      .update({
        status: "issued",
        issued_at: now,
        issued_by: admin.id,
      })
      .eq("id", allotment.id);

    for (const delegate of delegates ?? []) {
      if (!delegate.email) continue;
      const result = await sendAllotmentIssued({
        to: delegate.email,
        committee: committee?.name ?? "TBD",
        country: allotment.country ?? "TBD",
      });
      if (result.ok) emailsSent++;
    }

    await supabase
      .from("allotments")
      .update({ allotment_email_sent_at: now })
      .eq("id", allotment.id);
  }

  revalidatePath("/admin/allotments");
  return {
    success: `Issued ${eligible.length} allotments. ${emailsSent} emails sent.`,
  };
}
