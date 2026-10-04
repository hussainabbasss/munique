"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { seatKey } from "@/lib/allotments/countries";
import { assignSeats, scoreMerit, type EnginePerson } from "@/lib/allotments/batch-engine";
import { sendAllotmentChanged, sendAllotmentIssued } from "@/lib/email/send";
import { requireAdminRole, requireAdminUser } from "@/lib/admin/helpers";

export async function runMeritEngineAction(formData?: FormData) {
  await requireAdminUser();
  const supabase = await createClient();
  const startedAt = Date.now();

  // Optional group (e.g. a school batch) seated where committees are thinnest
  const fillGroup = String(formData?.get("fill_group") ?? "").trim();
  const fillNeedle = fillGroup.toLowerCase();
  // Google Form imports (the AMHSS batch) carry no school tag — match on source
  const fillImports = formData?.get("fill_form_imports") === "on";
  const fillLabel = [fillImports ? "Form imports" : null, fillGroup || null]
    .filter(Boolean)
    .join(" + ");

  const [{ data: confirmed, error: confirmedError }, { data: publishedCommittees }] =
    await Promise.all([
      supabase
        .from("registrations")
        .select(
          "id, type, school, source, head_email, brand_ambassador_name, mun_experience, payment_status, delegates(id, full_name, email, is_head_delegate, committee_pref_1, committee_pref_2, committee_pref_3, mun_experience)",
        )
        .eq("payment_status", "confirmed"),
      supabase
        .from("committees")
        .select("id, name, agenda, difficulty_tier, country_pool, allotments_paused")
        .eq("is_published", true)
        .order("display_order"),
    ]);

  if (confirmedError) {
    return { error: `Could not load registrations — nothing was changed. (${confirmedError.message})` };
  }

  if (!confirmed?.length) {
    return { error: "No confirmed registrations to score." };
  }

  if (!publishedCommittees?.length) {
    return { error: "No published committees — publish committees first." };
  }

  const committees = publishedCommittees.map((committee) => ({
    ...committee,
    country_pool: committee.country_pool ?? [],
    allotments_paused: Boolean(committee.allotments_paused),
  }));

  if (!committees.some((c) => !c.allotments_paused && (c.country_pool?.length ?? 0) > 0)) {
    return {
      error:
        "No open committees with an allotment pool — resume a paused committee or assign seats manually.",
    };
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
  for (const row of existingAllotments ?? []) {
    if (row.country && row.committee_id) {
      takenSeats.add(seatKey(row.committee_id, row.country));
    }
  }

  const people: EnginePerson[] = [];
  let skipped = 0;

  for (const reg of confirmed) {
    const groupText = [reg.school, reg.brand_ambassador_name, reg.head_email]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    for (const delegate of reg.delegates ?? []) {
      const existing = existingByDelegate.get(delegate.id);
      // Issued, overridden or already suggested seats are never re-allotted
      if (
        existing?.status === "issued" ||
        existing?.is_override ||
        (existing?.country && existing?.status === "pending")
      ) {
        skipped++;
        continue;
      }

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
        fill:
          (fillImports && reg.source === "form_import") ||
          Boolean(
            fillNeedle &&
              `${groupText} ${delegate.email ?? ""}`.toLowerCase().includes(fillNeedle),
          ),
      });
    }
  }

  if (!people.length) {
    return {
      error: `Nobody is waiting for the merit engine${skipped ? ` (${skipped} already hold a seat)` : ""}.`,
    };
  }

  const fillCount = people.filter((p) => p.fill).length;
  if (fillLabel && fillCount === 0) {
    return {
      error: fillImports
        ? `No waiting delegate is a Google Form import${fillGroup ? ` or matches "${fillGroup}"` : ""} — nothing was changed.`
        : `No waiting delegate matches "${fillGroup}" (school, reference or email) — nothing was changed.`,
    };
  }

  const { scores, geminiCalls, fallbackReason } = await scoreMerit(people);
  const scoredAt = Date.now();

  const results = assignSeats({
    people,
    scores: new Map([...scores].map(([id, s]) => [id, s.score])),
    committees,
    takenSeats,
  });

  const now = new Date().toISOString();
  const rows = results.map((result) => ({
    registration_id: result.person.registration_id,
    delegate_id: result.person.id,
    merit_score: result.merit_score,
    country: result.ok ? result.country : null,
    committee_id: result.ok ? result.committee_id : null,
    ai_reasoning: result.ok
      ? `${result.reasoning}${scores.get(result.person.id)?.source === "heuristic" ? " (Merit from keyword fallback — Gemini unavailable.)" : ""}`
      : result.reason,
    is_override: false,
    updated_at: now,
  }));

  const { error: saveError } = await supabase
    .from("allotments")
    .upsert(rows, { onConflict: "delegate_id" });

  if (saveError) {
    return { error: `Allotments could not be saved — nothing was changed. (${saveError.message})` };
  }

  revalidatePath("/admin/allotments");
  revalidatePath("/admin/countries");

  const seated = results.filter((r) => r.ok);
  const unseated = results.length - seated.length;
  const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
  const committeeName = new Map(committees.map((c) => [c.id, c.name]));

  const fillSummary = fillCount
    ? (() => {
        const counts = new Map<string, number>();
        for (const r of seated) {
          if (!r.person.fill) continue;
          const name = committeeName.get(r.committee_id) ?? "?";
          counts.set(name, (counts.get(name) ?? 0) + 1);
        }
        return `${fillLabel} (${fillCount}): ${[...counts]
          .sort((a, b) => b[1] - a[1])
          .map(([name, n]) => `${name} ${n}`)
          .join(", ")}`;
      })()
    : null;

  const heuristicCount = [...scores.values()].filter((s) => s.source === "heuristic").length;

  const parts = [
    `Allotted ${seated.length} of ${people.length} in ${seconds(Date.now() - startedAt)} (scoring ${seconds(scoredAt - startedAt)}, ${geminiCalls} Gemini call${geminiCalls === 1 ? "" : "s"})`,
    fillSummary,
    heuristicCount
      ? `${heuristicCount} scored by keyword fallback${fallbackReason ? ` — Gemini: ${fallbackReason.slice(0, 120)}` : ""}`
      : null,
    unseated ? `${unseated} could not be seated — set manually` : null,
    skipped ? `skipped ${skipped} already holding a seat` : null,
    "Nothing was emailed — review, then Issue allotments",
  ].filter(Boolean);

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
