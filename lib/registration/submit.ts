"use server";

import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase/admin";
import { generateRegistrationId } from "@/lib/registration/id";
import { computeFees } from "@/lib/registration/fees";
import {
  getDelegateCount,
  validateCommitteePrefs,
  validateDelegateAbout,
  validateDelegationMembers,
  validateDelegationSchoolHead,
  validatePaymentProof,
} from "@/lib/registration/validation";
import { fetchActivePricing } from "@/lib/registration/queries";
import { sendRegistrationReceived } from "@/lib/email/send";
import { fetchPublishedCommittees } from "@/lib/public/queries";
import type {
  DelegateDraft,
  DelegationDraft,
  Portal,
  SubmitResult,
} from "@/lib/registration/types";

function parseDelegateDraft(formData: FormData): DelegateDraft {
  return {
    fullName: String(formData.get("full_name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    school: String(formData.get("school") ?? "").trim(),
    committeePref1: String(formData.get("committee_pref_1") ?? ""),
    committeePref2: String(formData.get("committee_pref_2") ?? ""),
    committeePref3: String(formData.get("committee_pref_3") ?? ""),
    munExperience: String(formData.get("mun_experience") ?? "").trim(),
  };
}

function parseDelegationDraft(formData: FormData): DelegationDraft {
  const membersRaw = String(formData.get("members") ?? "[]");
  let members: DelegationDraft["members"] = [];

  try {
    const parsed = JSON.parse(membersRaw) as DelegationDraft["members"];
    if (Array.isArray(parsed)) {
      members = parsed.map((member) => ({
        fullName: String(member.fullName ?? "").trim(),
        email: String(member.email ?? "").trim(),
      }));
    }
  } catch {
    members = [];
  }

  return {
    school: String(formData.get("school") ?? "").trim(),
    headName: String(formData.get("head_name") ?? "").trim(),
    headEmail: String(formData.get("head_email") ?? "").trim().toLowerCase(),
    members,
    committeePref1: String(formData.get("committee_pref_1") ?? ""),
    committeePref2: String(formData.get("committee_pref_2") ?? ""),
    committeePref3: String(formData.get("committee_pref_3") ?? ""),
    munExperience: String(formData.get("mun_experience") ?? "").trim(),
  };
}

async function uploadPaymentProofFile(params: {
  service: ReturnType<typeof createServiceClient>;
  file: File;
  registrationId: string;
}) {
  const { service, file, registrationId } = params;
  if (!service) throw new Error("Supabase service client not configured.");

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
  if (!allowed.includes(file.type)) {
    throw new Error("Payment screenshot must be an image under 5 MB.");
  }

  const extFromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  const ext = extFromName && extFromName.length <= 6 ? extFromName : "png";
  const fileName = `${randomUUID()}.${ext}`;
  const path = `${registrationId}/${fileName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await service.storage
    .from("payment-proofs")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) throw uploadError;
  return path;
}

export async function submitRegistrationAction(
  formData: FormData,
): Promise<SubmitResult> {
  try {
    return await submitRegistration(formData);
  } catch (error) {
    console.error("submitRegistrationAction failed:", error);
    return {
      ok: false,
      error:
        "Registration could not be submitted. Please try again in a moment.",
    };
  }
}

async function submitRegistration(formData: FormData): Promise<SubmitResult> {
  const portal = String(formData.get("portal") ?? "") as Portal;
  if (portal !== "delegate" && portal !== "delegation") {
    return { ok: false, error: "Invalid registration portal." };
  }

  const service = createServiceClient();
  if (!service) {
    return { ok: false, error: "Registration is temporarily unavailable." };
  }

  const paymentProofFile = formData.get("payment_proof") as File | null;
  const paymentError = validatePaymentProof(paymentProofFile);
  if (paymentError) return { ok: false, error: paymentError };

  const pricing = await fetchActivePricing();
  if (!pricing) {
    return { ok: false, error: "Registration is not open yet." };
  }

  const committees = await fetchPublishedCommittees();
  if (committees.length === 0) {
    return {
      ok: false,
      error: "Committee preferences are unavailable. Please contact the EB.",
    };
  }

  let headEmail = "";
  let school = "";
  let delegateRows: {
    full_name: string;
    email: string | null;
    is_head_delegate: boolean;
    display_order: number;
  }[] = [];

  if (portal === "delegate") {
    const draft = parseDelegateDraft(formData);
    const aboutError = validateDelegateAbout(draft);
    if (aboutError) return { ok: false, error: aboutError };

    const prefsError = validateCommitteePrefs(draft, committees);
    if (prefsError) return { ok: false, error: prefsError };

    headEmail = draft.email;
    school = draft.school;
    delegateRows = [
      {
        full_name: draft.fullName,
        email: draft.email,
        is_head_delegate: true,
        display_order: 0,
      },
    ];

    const registrationId = await generateRegistrationId(service);
    const fees = computeFees(pricing, portal, 1);

    let paymentProofPath: string;
    try {
      paymentProofPath = await uploadPaymentProofFile({
        service,
        file: paymentProofFile!,
        registrationId,
      });
    } catch {
      return { ok: false, error: "Payment screenshot upload failed. Try again." };
    }

    const { data: registration, error: registrationError } = await service
      .from("registrations")
      .insert({
        registration_id: registrationId,
        type: "delegate",
        portal: "delegate",
        payment_status: "pending",
        fee_amount: fees.totalFee,
        school,
        head_email: headEmail,
        committee_pref_1: draft.committeePref1 || null,
        committee_pref_2: draft.committeePref2 || null,
        committee_pref_3: draft.committeePref3 || null,
        mun_experience: draft.munExperience,
        payment_proof_path: paymentProofPath,
      })
      .select("id")
      .single();

    if (registrationError || !registration) {
      return {
        ok: false,
        error: registrationError?.message ?? "Registration could not be saved.",
      };
    }

    const { error: delegatesError } = await service.from("delegates").insert(
      delegateRows.map((row) => ({
        ...row,
        registration_id: registration.id,
      })),
    );

    if (delegatesError) {
      await service.from("registrations").delete().eq("id", registration.id);
      return { ok: false, error: delegatesError.message };
    }

    const emailResult = await sendRegistrationReceived({
      to: headEmail,
      registrationId,
    });

    if (emailResult.ok) {
      await service
        .from("registrations")
        .update({ registration_email_sent_at: new Date().toISOString() })
        .eq("id", registration.id);
    } else {
      console.error(
        "[registration] confirmation email not sent:",
        emailResult.error,
        { registrationId, to: headEmail },
      );
    }

    return { ok: true, registrationId, headEmail };
  }

  const draft = parseDelegationDraft(formData);
  const schoolHeadError = validateDelegationSchoolHead(draft);
  if (schoolHeadError) return { ok: false, error: schoolHeadError };

  const membersError = validateDelegationMembers(draft);
  if (membersError) return { ok: false, error: membersError };

  const prefsError = validateCommitteePrefs(draft, committees);
  if (prefsError) return { ok: false, error: prefsError };

  headEmail = draft.headEmail;
  school = draft.school;
  const delegateCount = getDelegateCount(portal, draft);
  delegateRows = [
    {
      full_name: draft.headName,
      email: draft.headEmail,
      is_head_delegate: true,
      display_order: 0,
    },
    ...draft.members.map((member, index) => ({
      full_name: member.fullName,
      email: member.email || null,
      is_head_delegate: false,
      display_order: index + 1,
    })),
  ];

  const registrationId = await generateRegistrationId(service);
  const fees = computeFees(pricing, portal, delegateCount);

  let paymentProofPath: string;
  try {
    paymentProofPath = await uploadPaymentProofFile({
      service,
      file: paymentProofFile!,
      registrationId,
    });
  } catch {
    return { ok: false, error: "Payment screenshot upload failed. Try again." };
  }

  const { data: registration, error: registrationError } = await service
    .from("registrations")
    .insert({
      registration_id: registrationId,
      type: "delegation",
      portal: "delegation",
      payment_status: "pending",
      fee_amount: fees.totalFee,
      school,
      head_email: headEmail,
      committee_pref_1: draft.committeePref1 || null,
      committee_pref_2: draft.committeePref2 || null,
      committee_pref_3: draft.committeePref3 || null,
      mun_experience: draft.munExperience,
      payment_proof_path: paymentProofPath,
    })
    .select("id")
    .single();

  if (registrationError || !registration) {
    return {
      ok: false,
      error: registrationError?.message ?? "Registration could not be saved.",
    };
  }

  const { error: delegatesError } = await service.from("delegates").insert(
    delegateRows.map((row) => ({
      ...row,
      registration_id: registration.id,
    })),
  );

  if (delegatesError) {
    await service.from("registrations").delete().eq("id", registration.id);
    return { ok: false, error: delegatesError.message };
  }

  const emailResult = await sendRegistrationReceived({
    to: headEmail,
    registrationId,
  });

  if (emailResult.ok) {
    await service
      .from("registrations")
      .update({ registration_email_sent_at: new Date().toISOString() })
      .eq("id", registration.id);
  }

  return { ok: true, registrationId, headEmail };
}
