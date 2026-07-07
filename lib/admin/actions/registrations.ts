"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { sendPaymentConfirmed, sendRegistrationReceived } from "@/lib/email/send";
import {
  requireAdminUser,
  requireRegistrationStaffOrAdmin,
} from "@/lib/admin/helpers";
import { fetchActivePricing } from "@/lib/registration/queries";

const PAYMENT_PROOF_MAX_BYTES = 5 * 1024 * 1024;

function fileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif", "heic"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

export async function uploadPaymentProofAction(formData: FormData) {
  await requireRegistrationStaffOrAdmin();

  const registrationId = String(formData.get("registration_id") ?? "");
  const file = formData.get("payment_proof");

  if (!registrationId) {
    return { error: "Registration is required." };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Select a payment screenshot to upload." };
  }

  if (!file.type.startsWith("image/")) {
    return { error: "Payment screenshot must be an image under 5 MB." };
  }

  if (file.size > PAYMENT_PROOF_MAX_BYTES) {
    return { error: "Payment screenshot must be an image under 5 MB." };
  }

  const supabase = await createClient();
  const service = createServiceClient();
  if (!service) return { error: "Storage is not configured." };

  const { data: reg } = await supabase
    .from("registrations")
    .select("id, registration_id, payment_status, payment_proof_path")
    .eq("id", registrationId)
    .single();

  if (!reg) return { error: "Registration not found." };
  if (reg.payment_status === "confirmed") {
    return { error: "Payment is already confirmed for this registration." };
  }

  const storagePath = `${reg.registration_id}/${crypto.randomUUID()}.${fileExtension(file)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await service.storage
    .from("payment-proofs")
    .upload(storagePath, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  if (reg.payment_proof_path) {
    await service.storage.from("payment-proofs").remove([reg.payment_proof_path]);
  }

  const { error: updateError } = await supabase
    .from("registrations")
    .update({ payment_proof_path: storagePath })
    .eq("id", registrationId);

  if (updateError) {
    await service.storage.from("payment-proofs").remove([storagePath]);
    return { error: updateError.message };
  }

  revalidatePath("/admin/registrations");
  return { success: "Payment screenshot attached." };
}

export async function confirmPaymentAction(registrationId: string) {
  const admin = await requireRegistrationStaffOrAdmin();
  const supabase = await createClient();

  const { data: reg } = await supabase
    .from("registrations")
    .select(
      "id, registration_id, head_email, payment_status, payment_proof_path",
    )
    .eq("id", registrationId)
    .single();

  if (!reg || reg.payment_status !== "pending") {
    return { error: "Registration not found or not pending." };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("registrations")
    .update({
      payment_status: "confirmed",
      confirmed_at: now,
      confirmed_by: admin.id,
    })
    .eq("id", registrationId);

  if (error) return { error: error.message };

  const emailResult = await sendPaymentConfirmed({
    to: reg.head_email,
    registrationId: reg.registration_id,
  });

  if (emailResult.ok) {
    await supabase
      .from("registrations")
      .update({ payment_email_sent_at: now })
      .eq("id", registrationId);
  }

  revalidatePath("/admin/registrations");
  revalidatePath("/admin");
  revalidatePath("/admin/allotments");

  return emailResult.ok
    ? { success: "Payment confirmed. Confirmation email sent." }
    : {
        success: "Payment confirmed. Email could not be sent — retry from row actions.",
        emailFailed: true,
      };
}

export async function rejectPaymentAction(registrationId: string) {
  await requireAdminUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("registrations")
    .update({ payment_status: "rejected" })
    .eq("id", registrationId)
    .eq("payment_status", "pending");

  if (error) return { error: error.message };

  revalidatePath("/admin/registrations");
  return { success: "Payment rejected" };
}

export async function resendRegistrationEmailAction(registrationId: string) {
  await requireAdminUser();
  const supabase = await createClient();

  const { data: reg } = await supabase
    .from("registrations")
    .select("id, registration_id, head_email, fee_amount")
    .eq("id", registrationId)
    .single();

  if (!reg) return { error: "Registration not found." };

  const pricing = await fetchActivePricing();
  if (!pricing) {
    return { error: "Active pricing is not configured — cannot include bank details." };
  }

  const emailResult = await sendRegistrationReceived({
    to: reg.head_email,
    registrationId: reg.registration_id,
    payment: {
      feeAmount: reg.fee_amount,
      bankAccountTitle: pricing.bank_account_title,
      bankDetails: pricing.bank_details,
      paymentInstructions: pricing.payment_instructions,
    },
  });

  if (!emailResult.ok) {
    return { error: emailResult.error };
  }

  await supabase
    .from("registrations")
    .update({ registration_email_sent_at: new Date().toISOString() })
    .eq("id", registrationId);

  revalidatePath("/admin/registrations");
  return { success: `Registration email sent to ${reg.head_email}` };
}
