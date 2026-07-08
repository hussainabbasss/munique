"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/admin/helpers";

export async function saveEbMemberAction(formData: FormData) {
  await requireAdminUser();

  const id = String(formData.get("id") ?? "") || null;
  const fullName = String(formData.get("full_name") ?? "").trim();
  const roleTitle = String(formData.get("role_title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const isFounder = formData.get("is_founder") === "on";
  const displayOrder = parseInt(String(formData.get("display_order") ?? "0"), 10);
  const isPublished = formData.get("is_published") === "on";

  if (!fullName) return { error: "Name is required." };

  const payload = {
    full_name: fullName,
    role_title: roleTitle,
    description,
    is_founder: isFounder,
    display_order: displayOrder,
    is_published: isPublished,
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase.from("eb_members").update(payload).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("eb_members").insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/eb");
  revalidatePath("/eb");
  revalidatePath("/");
  return { success: "EB member saved" };
}

export async function uploadEbPortraitAction(formData: FormData) {
  await requireAdminUser();

  const memberId = String(formData.get("member_id") ?? "");
  const file = formData.get("portrait") as File | null;

  if (!memberId || !file?.size) {
    return { error: "Select a portrait image." };
  }

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return { error: "Portrait must be JPEG, PNG, or WebP." };
  }

  if (file.size > 3 * 1024 * 1024) {
    return { error: "Portrait must be under 3MB." };
  }

  const service = createServiceClient();
  if (!service) return { error: "Storage not configured." };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${memberId}/portrait.${ext === "jpeg" ? "jpg" : ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await service.storage
    .from("eb-portraits")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return { error: uploadError.message };

  const supabase = await createClient();
  await supabase
    .from("eb_members")
    .update({ portrait_path: path, updated_at: new Date().toISOString() })
    .eq("id", memberId);

  revalidatePath("/admin/eb");
  revalidatePath("/eb");
  revalidatePath("/");
  return { success: "Portrait uploaded" };
}

export async function deleteEbMemberAction(memberId: string) {
  await requireAdminUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("eb_members")
    .select("portrait_path")
    .eq("id", memberId)
    .single();

  if (data?.portrait_path) {
    const service = createServiceClient();
    await service?.storage.from("eb-portraits").remove([data.portrait_path]);
  }

  await supabase.from("eb_members").delete().eq("id", memberId);

  revalidatePath("/admin/eb");
  revalidatePath("/eb");
  revalidatePath("/");
  return { success: "Member removed" };
}
