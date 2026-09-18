"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { seatKey } from "@/lib/allotments/countries";
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

  // Every allotment, not just this batch — a failed lookup here would make the
  // engine re-score (and overwrite) issued and overridden allotments.
  const { data: existingAllotments, error: existingError } = await supabase
    .from("allotments")
    .select("delegate_id, committee_id, status, is_override, country");

  if (existingError) {
    return {
      error: `Could not load existing allotments — nothing was changed. (${existingError.message})`,
    };
  }

  const existingByDelegate = new Map(
    (existingAllotments ?? []).map((row) => [row.delegate_id, row]),
  );

  // Seats are per committee: Pakistan in one committee leaves Pakistan free elsewhere
  const takenSeats = new Set<string>();
  let processed = 0;
  let failed = 0;
  let skipped = 0;

  // Seed from every held seat so re-runs don't double-assign within a committee
  for (const row of existingAllotments ?? []) {
    if (row.country && row.committee_id) {
      takenSeats.add(seatKey(row.committee_id, row.country));
    }
  }

  // Free tier ≈ 15 RPM for flash-lite — stay under that by default
  const paceMs = Number(process.env.GEMINI_PACE_MS ?? "5000");
  let stoppedEarly = false;
  let earlyStopReason: string | null = null;

  for (const person of people) {
    const existing = existingByDelegate.get(person.id);
    if (existing?.status === "issued" || existing?.is_override) {
      skipped++;
      continue;
    }

    // Already has a suggested seat — don't burn quota re-scoring unless empty
    if (existing?.country && existing?.status === "pending") {
      skipped++;
      continue;
    }

    if (processed + failed > 0 && paceMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, paceMs));
    }

    const result = await suggestAllotment({
      person,
      committees,
      takenSeats,
    });

    if (result.ok) {
      const { error: saveError } = await supabase.from("allotments").upsert(
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

      if (saveError) {
        // Not saved, so the seat is not actually held
        takenSeats.delete(seatKey(result.committee_id, result.country));
        console.error("[allotments] could not save suggestion", {
          delegateId: person.id,
          error: saveError.message,
        });
        failed++;
        continue;
      }
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

      if (result.abortBatch || result.quotaExhausted) {
        stoppedEarly = true;
        earlyStopReason = result.reason;
        break;
      }
    }
  }

  revalidatePath("/admin/allotments");
  revalidatePath("/admin/countries");

  if (stoppedEarly) {
    return {
      error:
        earlyStopReason ??
        `Merit engine stopped early after scoring ${processed} delegate${processed === 1 ? "" : "s"}. Remaining people can be set manually via Set allotment.`,
    };
  }

  const parts = [
    `Scored ${processed} delegates with Gemini`,
    failed > 0 ? `${failed} failed — set manually` : null,
    skipped > 0 ? `skipped ${skipped} issued/overridden/already suggested` : null,
  ].filter(Boolean);

  if (processed === 0 && failed > 0) {
    return {
      error: `Merit engine failed for ${failed} delegate${failed === 1 ? "" : "s"}. Use Set allotment to assign manually.`,
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

  if (!country || !committeeId) {
    return { error: "Choose both a committee and a country." };
  }

  const supabase = await createClient();

  // A seat is one country in one committee — block a second holder
  const { data: committeeSeats, error: seatsError } = await supabase
    .from("allotments")
    .select("delegate_id, country, delegates(full_name)")
    .eq("committee_id", committeeId)
    .neq("delegate_id", delegateId)
    .not("country", "is", null);

  if (seatsError) return { error: seatsError.message };

  const wanted = seatKey(committeeId, country);
  const holder = (committeeSeats ?? []).find(
    (row) => row.country && seatKey(committeeId, row.country) === wanted,
  );

  if (holder) {
    const holderName =
      (holder.delegates as unknown as { full_name: string } | null)
        ?.full_name ?? "another delegate";
    return {
      error: `${country} is already taken in this committee by ${holderName}. Pick another country or move them first.`,
    };
  }

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
  revalidatePath("/admin/countries");
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
  revalidatePath("/admin/countries");
  return {
    success:
      allotmentsNewlyIssued > 0
        ? `Issued ${allotmentsNewlyIssued} allotments. ${emailsSent} emails sent.`
        : `Sent ${emailsSent} allotment emails.`,
  };
}
