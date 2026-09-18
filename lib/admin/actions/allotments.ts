"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { seatKey } from "@/lib/allotments/countries";
import { suggestAllotment } from "@/lib/allotments/merit-engine";
import type { MeritDelegateInput } from "@/lib/allotments/types";
import { sendAllotmentChanged, sendAllotmentIssued } from "@/lib/email/send";
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

/**
 * A seat is one country in one committee. Returns an error message when
 * someone other than `delegateId` already holds it, otherwise null.
 */
async function seatTakenError(
  supabase: Awaited<ReturnType<typeof createClient>>,
  committeeId: string,
  country: string,
  delegateId: string,
): Promise<string | null> {
  const { data: committeeSeats, error } = await supabase
    .from("allotments")
    .select("delegate_id, country, delegates(full_name)")
    .eq("committee_id", committeeId)
    .neq("delegate_id", delegateId)
    .not("country", "is", null);

  if (error) return error.message;

  const wanted = seatKey(committeeId, country);
  const holder = (committeeSeats ?? []).find(
    (row) => row.country && seatKey(committeeId, row.country) === wanted,
  );
  if (!holder) return null;

  const holderName =
    (holder.delegates as unknown as { full_name: string } | null)?.full_name ??
    "another delegate";
  return `${country} is already taken in this committee by ${holderName}. Pick another country or move them first.`;
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

  const seatError = await seatTakenError(
    supabase,
    committeeId,
    country,
    delegateId,
  );
  if (seatError) return { error: seatError };

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

/**
 * Change the committee/country of an allotment that was already issued, then
 * email the delegate the new allotment. There is one allotment row per
 * delegate, so moving it frees their previous seat in that committee's pool.
 */
export async function changeIssuedAllotmentAction(formData: FormData) {
  const admin = await requireAdminRole();

  const allotmentId = String(formData.get("allotment_id") ?? "");
  const country = String(formData.get("country") ?? "").trim();
  const committeeId = String(formData.get("committee_id") ?? "");
  const overrideNote = String(formData.get("override_note") ?? "") || null;

  if (!allotmentId) return { error: "Missing allotment." };
  if (!country || !committeeId) {
    return { error: "Choose both a committee and a country." };
  }
  // The email goes out immediately — the dialog must have been confirmed
  if (formData.get("confirm_resend") !== "yes") {
    return { error: "Confirm the change before the email is resent." };
  }

  const supabase = await createClient();

  const [{ data: current, error: currentError }, { data: newCommittee }] =
    await Promise.all([
      supabase
        .from("allotments")
        .select(
          "id, delegate_id, country, committee_id, status, registrations(payment_status), delegates(id, email, full_name), committees(name)",
        )
        .eq("id", allotmentId)
        .maybeSingle(),
      supabase
        .from("committees")
        .select("id, name")
        .eq("id", committeeId)
        .maybeSingle(),
    ]);

  if (currentError) return { error: currentError.message };
  if (!current) return { error: "Allotment not found." };
  if (!newCommittee) return { error: "Committee not found." };

  if (current.status !== "issued") {
    return { error: "This allotment has not been issued yet — use Adjust." };
  }

  const reg = current.registrations as unknown as {
    payment_status: string;
  } | null;
  if (reg?.payment_status !== "confirmed") {
    return { error: "Registration is not confirmed — no email can be sent." };
  }

  const previousCountry = current.country ?? "";
  const unchanged =
    current.committee_id === committeeId &&
    seatKey(committeeId, previousCountry) === seatKey(committeeId, country);
  if (unchanged) {
    return { error: "That is already this delegate's allotment." };
  }

  const seatError = await seatTakenError(
    supabase,
    committeeId,
    country,
    current.delegate_id,
  );
  if (seatError) return { error: seatError };

  const delegate = current.delegates as unknown as {
    id: string;
    email: string | null;
    full_name: string;
  } | null;
  const previousCommittee =
    (current.committees as unknown as { name: string } | null)?.name ?? "TBD";

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("allotments")
    .update({
      country,
      committee_id: committeeId,
      is_override: true,
      override_note: overrideNote,
      issued_at: now,
      issued_by: admin.id,
      updated_at: now,
    })
    .eq("id", allotmentId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/allotments");
  revalidatePath("/admin/countries");

  const summary = `${delegate?.full_name ?? "Delegate"} moved to ${newCommittee.name} — ${country}. ${previousCommittee} — ${previousCountry || "previous seat"} is free again.`;

  if (!delegate?.email) {
    return {
      success: `${summary} No email on file, so the delegate was not notified.`,
    };
  }

  const result = await sendAllotmentChanged({
    to: delegate.email,
    committee: newCommittee.name,
    country,
    previousCommittee,
    previousCountry: previousCountry || "TBD",
  });

  if (!result.ok) {
    // Mark the email as unsent so "Issue allotments" picks this delegate up again
    await Promise.all([
      supabase
        .from("delegates")
        .update({ allotment_email_sent_at: null })
        .eq("id", delegate.id),
      supabase
        .from("allotments")
        .update({ allotment_email_sent_at: null })
        .eq("id", allotmentId),
    ]);
    console.error("[allotments] change email failed", {
      delegateId: delegate.id,
      error: result.error,
    });
    return {
      // The allotment itself was changed — only the email is outstanding
      saved: true,
      error: `${summary} The email failed to send (${result.error}) — it is queued under Issue allotments to retry.`,
    };
  }

  await Promise.all([
    supabase
      .from("delegates")
      .update({ allotment_email_sent_at: now })
      .eq("id", delegate.id),
    supabase
      .from("allotments")
      .update({ allotment_email_sent_at: now })
      .eq("id", allotmentId),
  ]);

  return { success: `${summary} Email resent to ${delegate.email}.` };
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
