"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { suggestAllotment } from "@/lib/allotments/merit-engine";
import type { MeritRegistration } from "@/lib/allotments/types";
import {
  sendAllotmentIssued,
  sendDelegationAllotmentIssued,
} from "@/lib/email/send";
import { requireAdminRole, requireAdminUser } from "@/lib/admin/helpers";

type DelegateRow = {
  id: string;
  email: string | null;
  full_name: string;
  is_head_delegate: boolean;
  allotment_email_sent_at: string | null;
};

type RegistrationRow = {
  payment_status: string;
  type: "delegate" | "delegation";
  head_email: string;
  school: string;
  registration_id: string;
  delegates: DelegateRow[] | null;
};

function delegatesNeedingEmail(
  reg: RegistrationRow,
  allotmentCountry: string | null,
) {
  if (!reg || reg.payment_status !== "confirmed" || !allotmentCountry) {
    return [];
  }

  const delegates = reg.delegates ?? [];

  if (reg.type === "delegation") {
    const head =
      delegates.find((d) => d.is_head_delegate && d.email) ??
      delegates.find((d) => d.email);
    if (!head || head.allotment_email_sent_at) return [];
    return [head];
  }

  return delegates.filter((d) => d.email && !d.allotment_email_sent_at);
}

export async function runMeritEngineAction() {
  await requireAdminUser();
  const supabase = await createClient();

  const [{ data: confirmed }, { data: publishedCommittees }] = await Promise.all([
    supabase
      .from("registrations")
      .select(
        "id, type, school, mun_experience, committee_pref_1, committee_pref_2, committee_pref_3, delegates(full_name, is_head_delegate)",
      )
      .eq("payment_status", "confirmed"),
    supabase
      .from("committees")
      .select("id, name, agenda, difficulty_tier")
      .eq("is_published", true)
      .order("display_order"),
  ]);

  if (!confirmed?.length) {
    return { error: "No confirmed registrations to score." };
  }

  if (!publishedCommittees?.length) {
    return { error: "No published committees — publish committees first." };
  }

  const takenCountries = new Set<string>();
  let processed = 0;
  let skipped = 0;
  const geminiUsed = Boolean(process.env.GEMINI_API_KEY);

  const registrationIds = confirmed.map((r) => r.id);
  const { data: existingAllotments } = await supabase
    .from("allotments")
    .select("registration_id, status, is_override, country")
    .in("registration_id", registrationIds);

  const existingByRegistration = new Map(
    (existingAllotments ?? []).map((row) => [row.registration_id, row]),
  );

  for (const reg of confirmed) {
    const existing = existingByRegistration.get(reg.id);
    if (existing?.status === "issued" || existing?.is_override) {
      skipped++;
      if (existing.country) {
        takenCountries.add(existing.country.toLowerCase());
      }
      continue;
    }

    const registration: MeritRegistration = {
      id: reg.id,
      type: reg.type as "delegate" | "delegation",
      mun_experience: reg.mun_experience,
      school: reg.school,
      committee_pref_1: reg.committee_pref_1,
      committee_pref_2: reg.committee_pref_2,
      committee_pref_3: reg.committee_pref_3,
      delegates: (reg.delegates ?? []).map((d) => ({
        full_name: d.full_name,
        is_head_delegate: d.is_head_delegate,
      })),
    };

    const suggestion = await suggestAllotment({
      registration,
      committees: publishedCommittees,
      takenCountries,
    });

    await supabase.from("allotments").upsert(
      {
        registration_id: reg.id,
        merit_score: suggestion.merit_score,
        country: suggestion.country,
        committee_id: suggestion.committee_id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "registration_id" },
    );

    processed++;
  }

  revalidatePath("/admin/allotments");
  const skipNote = skipped > 0 ? ` Skipped ${skipped} issued or manually overridden.` : "";
  return {
    success: geminiUsed
      ? `Merit engine scored ${processed} registrations with Gemini.${skipNote}`
      : `Merit engine scored ${processed} registrations (heuristic — set GEMINI_API_KEY for AI).${skipNote}`,
  };
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

  const { data: allotments } = await supabase
    .from("allotments")
    .select(
      "id, registration_id, country, status, registrations(payment_status, type, head_email, school, registration_id, delegates(id, email, full_name, is_head_delegate, allotment_email_sent_at)), committees(name)",
    )
    .not("country", "is", null);

  const eligible =
    allotments?.filter((a) => {
      const reg = a.registrations as unknown as RegistrationRow | null;
      return reg?.payment_status === "confirmed";
    }) ?? [];

  if (!eligible.length) {
    return { error: "No allotments ready to issue." };
  }

  const now = new Date().toISOString();
  let emailsSent = 0;
  let allotmentsNewlyIssued = 0;

  for (const allotment of eligible) {
    const reg = allotment.registrations as unknown as RegistrationRow;
    const committee = allotment.committees as unknown as { name: string } | null;
    const targets = delegatesNeedingEmail(reg, allotment.country);

    if (!targets.length) continue;

    let sentForAllotment = 0;
    const allDelegates = reg.delegates ?? [];

    if (reg.type === "delegation") {
      const head = targets[0];
      if (!head?.email) continue;

      const memberNames = allDelegates.map((d) => d.full_name);
      const result = await sendDelegationAllotmentIssued({
        to: head.email,
        groupName: reg.school || "Your delegation",
        committee: committee?.name ?? "TBD",
        country: allotment.country ?? "TBD",
        memberNames,
        delegateCount: allDelegates.length,
      });

      if (!result.ok) continue;

      emailsSent++;
      sentForAllotment++;

      await supabase
        .from("delegates")
        .update({ allotment_email_sent_at: now })
        .eq("registration_id", allotment.registration_id);
    } else {
      for (const delegate of targets) {
        if (!delegate.email) continue;
        const result = await sendAllotmentIssued({
          to: delegate.email,
          committee: committee?.name ?? "TBD",
          country: allotment.country ?? "TBD",
        });
        if (!result.ok) continue;

        emailsSent++;
        sentForAllotment++;

        await supabase
          .from("delegates")
          .update({ allotment_email_sent_at: now })
          .eq("id", delegate.id);
      }
    }

    if (sentForAllotment === 0) continue;

    if (allotment.status === "pending") {
      await supabase
        .from("allotments")
        .update({
          status: "issued",
          issued_at: now,
          issued_by: admin.id,
          allotment_email_sent_at: now,
        })
        .eq("id", allotment.id);
      allotmentsNewlyIssued++;
    } else {
      await supabase
        .from("allotments")
        .update({ allotment_email_sent_at: now })
        .eq("id", allotment.id);
    }
  }

  if (emailsSent === 0) {
    return { error: "No delegates are waiting for allotment emails." };
  }

  revalidatePath("/admin/allotments");
  return {
    success:
      allotmentsNewlyIssued > 0
        ? `Issued ${allotmentsNewlyIssued} allotments. ${emailsSent} emails sent.`
        : `Sent ${emailsSent} allotment emails to new delegates.`,
  };
}
