"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminRole } from "@/lib/admin/helpers";

export async function savePricingAction(formData: FormData) {
  await requireAdminRole();

  const delegateFee = parseInt(String(formData.get("delegate_fee")), 10);
  const delegationFee = parseInt(String(formData.get("delegation_fee")), 10);
  const earlyBirdEnabled = formData.get("early_bird_enabled") === "on";
  const earlyBirdDeadline = String(formData.get("early_bird_deadline") ?? "") || null;
  const earlyBirdDelegateFee = formData.get("early_bird_delegate_fee")
    ? parseInt(String(formData.get("early_bird_delegate_fee")), 10)
    : null;
  const earlyBirdDelegationFee = formData.get("early_bird_delegation_fee")
    ? parseInt(String(formData.get("early_bird_delegation_fee")), 10)
    : null;

  if (Number.isNaN(delegateFee) || Number.isNaN(delegationFee)) {
    return { error: "Fees must be whole PKR amounts." };
  }

  const supabase = await createClient();

  await supabase
    .from("pricing_config")
    .update({ is_active: false })
    .eq("is_active", true);

  const { error } = await supabase.from("pricing_config").insert({
    is_active: true,
    delegate_fee: delegateFee,
    delegation_fee: delegationFee,
    early_bird_enabled: earlyBirdEnabled,
    early_bird_deadline: earlyBirdDeadline,
    early_bird_delegate_fee: earlyBirdDelegateFee,
    early_bird_delegation_fee: earlyBirdDelegationFee,
    bank_account_title: String(formData.get("bank_account_title") ?? ""),
    bank_details: String(formData.get("bank_details") ?? ""),
    payment_instructions: String(formData.get("payment_instructions") ?? ""),
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/pricing");
  return { success: "Pricing saved" };
}
