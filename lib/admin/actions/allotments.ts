"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { suggestAllotment } from "@/lib/allotments/merit-engine";
import type { MeritDelegateInput } from "@/lib/allotments/types";
import { sendAllotmentIssued } from "@/lib/email/send";
import { requireAdminRole, requireAdminUser } from "@/lib/admin/helpers";

export async function runMeritEngineAction() {
  await requireAdminUser();
  const supabase = await createClient();

  const [{ data: confirmed }, { data: publishedCommittees }] = await Promise.all([
    supabase
      .from("registrations")
      .select(
        "id, type, school, mun_experience, payment_status, delegates(id, full_name, is_head_delegate, committee_pref_1, committee_pref_2, committee_pref_3, mun_experience)",
      )
      .eq("payment_status", "confirmed"),
    supabase
      .from("committees")
      .select("id, name, agenda, difficulty_tier, country_pool")
      .eq("is_published", true)
      .order("display_order"),
  ]);

  if (!confirmed?.length) {
    return { error: "No confirmed registrations to score." };
  }

  if (!publishedCommittees?.length) {
    return { error: "No published committees — publish committees first." };
  }

  const committees = (publishedCommittees ?? []).map((committee) => ({
    ...committee,
    country_pool: committee.country_pool ?? [],
  }));

  if (!committees.some((c) => (c.country_pool?.length ?? 0) > 0)) {
    return {
      error:
        "No published committees with an allotment pool — add allotments on each committee first.",
    };
  }

  const people: MeritDelegateInput[] = [];
  for (const reg of confirmed) {
    for (const delegate of reg.delegates ?? []) {
      people.push({
        id: delegate.id,
        registration_id: reg.id,
        full_name: delegate.full_name,
        is_head_delegate: delegate.is_head_delegate,
        type: reg.type as "delegate" | "delegation",
        school: reg.school,
        mun_experience:
          (delegate.mun_experience && String(delegate.mun_experience).trim()) ||
          reg.mun_experience,
        committee_pref_1: delegate.committee_pref_1,
        committee_pref_2: delegate.committee_pref_2,
        committee_pref_3: delegate.committee_pref_3,
      });
    }
  }

  if (!people.length) {
    return { error: "No delegates found on confirmed registrations." };
  }

  const delegateIds = people.map((p) => p.id);
  const { data: existingAllotments } = await supabase
    .from("allotments")
    .select("delegate_id, status, is_override, country")
    .in("delegate_id", delegateIds);

  const existingByDelegate = new Map(
    (existingAllotments ?? []).map((row) => [row.delegate_id, row]),
  );

  const takenCountries = new Set<string>();
  let processed = 0;
  let failed = 0;
  let skipped = 0;

  for (const person of people) {
    const existing = existingByDelegate.get(person.id);
    if (existing?.status === "issued" || existing?.is_override) {
      skipped++;
      if (existing.country) {
        takenCountries.add(existing.country.toLowerCase());
      }
      continue;
    }

    const result = await suggestAllotment({
      person,
      committees,
      takenCountries,
    });

    if (result.ok) {
      await supabase.from("allotments").upsert(
        {
          registration_id: person.registration_id,
          delegate_id: person.id,
          merit_score: result.merit_score,
          country: result.country,
          committee_id: result.committee_id,
          ai_reasoning: result.reasoning ?? null,
          is_override: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "delegate_id" },
      );
      processed++;
    } else {
      await supabase.from("allotments").upsert(
        {
          registration_id: person.registration_id,
          delegate_id: person.id,
          merit_score: null,
          country: null,
          committee_id: null,
          ai_reasoning: result.reason,
          is_override: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "delegate_id" },
      );
      failed++;
    }
  }

  revalidatePath("/admin/allotments");
  const parts = [
    `Scored ${processed} delegates with Gemini`,
    failed > 0 ? `${failed} failed — set manually` : null,
    skipped > 0 ? `skipped ${skipped} issued/overridden` : null,
  ].filter(Boolean);

  if (processed === 0 && failed > 0) {
    return {
      error: `Merit engine failed for ${failed} delegate${failed === 1 ? "" : "s"}. Use Adjust to set allotments manually.`,
    };
  }

  return { success: `${parts.join(". ")}.` };
}

export async function saveAllotmentOverrideAction(formData: FormData) {
  await requireAdminUser();

  const allotmentId = String(formData.get("allotment_id") ?? "");
  const registrationId = String(formData.get("registration_id") ?? "");
  const delegateId = String(formData.get("delegate_id") ?? "");
  const country = String(formData.get("country") ?? "").trim();
  const committeeId = String(formData.get("committee_id") ?? "") || null;
  const overrideNote = String(formData.get("override_note") ?? "") || null;

  if (!delegateId || !registrationId) {
    return { error: "Missing delegate for allotment override." };
  }

  const supabase = await createClient();
  const payload = {
    registration_id: registrationId,
    delegate_id: delegateId,
    country,
    committee_id: committeeId,
    is_override: true,
    override_note: overrideNote,
    updated_at: new Date().toISOString(),
  };

  const { error } = allotmentId
    ? await supabase.from("allotments").update(payload).eq("id", allotmentId)
    : await supabase.from("allotments").upsert(payload, {
        onConflict: "delegate_id",
      });

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
      "id, registration_id, delegate_id, country, status, registrations(payment_status, type, registration_id, school), delegates(id, email, full_name, is_head_delegate, allotment_email_sent_at), committees(name)",
    )
    .not("country", "is", null);

  const eligible =
    allotments?.filter((a) => {
      const reg = a.registrations as unknown as {
        payment_status: string;
      } | null;
      return reg?.payment_status === "confirmed";
    }) ?? [];

  if (!eligible.length) {
    return { error: "No allotments ready to issue." };
  }

  const now = new Date().toISOString();
  let emailsSent = 0;
  let allotmentsNewlyIssued = 0;
  let skippedNoEmail = 0;
  let sendFailures = 0;

  for (const allotment of eligible) {
    const delegate = allotment.delegates as unknown as {
      id: string;
      email: string | null;
      full_name: string;
      allotment_email_sent_at: string | null;
    } | null;
    const committee = allotment.committees as unknown as { name: string } | null;

    if (!delegate) continue;
    if (delegate.allotment_email_sent_at) continue;
    if (!delegate.email) {
      skippedNoEmail++;
      continue;
    }

    const result = await sendAllotmentIssued({
      to: delegate.email,
      committee: committee?.name ?? "TBD",
      country: allotment.country ?? "TBD",
    });

    if (!result.ok) {
      sendFailures++;
      console.error("[allotments] issue email failed", {
        delegateId: delegate.id,
        error: result.error,
      });
      continue;
    }

    emailsSent++;

    await supabase
      .from("delegates")
      .update({ allotment_email_sent_at: now })
      .eq("id", delegate.id);

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
    if (sendFailures > 0) {
      return {
        error: `Allotment emails failed to send (${sendFailures}). Check Resend logs.`,
      };
    }
    if (skippedNoEmail > 0) {
      return {
        error: `${skippedNoEmail} delegate(s) have an allotment but no email address.`,
      };
    }
    return { error: "No delegates are waiting for allotment emails." };
  }

  revalidatePath("/admin/allotments");
  return {
    success:
      allotmentsNewlyIssued > 0
        ? `Issued ${allotmentsNewlyIssued} allotments. ${emailsSent} emails sent.`
        : `Sent ${emailsSent} allotment emails.`,
  };
}
