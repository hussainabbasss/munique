"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/admin/helpers";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function saveCommitteeAction(formData: FormData) {
  await requireAdminUser();

  const id = String(formData.get("id") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim() || slugify(name);
  const shortDescription = String(formData.get("short_description") ?? "");
  const agenda = String(formData.get("agenda") ?? "");
  const difficultyTier = String(formData.get("difficulty_tier") ?? "medium");
  const displayOrder = parseInt(String(formData.get("display_order") ?? "0"), 10);
  const isPublished = formData.get("is_published") === "on";

  if (!name) return { error: "Name is required." };

  const payload = {
    name,
    slug,
    short_description: shortDescription,
    agenda,
    difficulty_tier: difficultyTier,
    display_order: displayOrder,
    is_published: isPublished,
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("committees")
      .update(payload)
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("committees").insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/committees");
  revalidatePath("/committees");
  return { success: "Committee saved" };
}

export async function uploadStudyGuideAction(formData: FormData) {
  await requireAdminUser();

  const committeeId = String(formData.get("committee_id") ?? "");
  const file = formData.get("file") as File | null;

  if (!committeeId || !file?.size) {
    return { error: "Select a PDF to upload." };
  }

  if (file.type !== "application/pdf") {
    return { error: "Study guide must be a PDF." };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { error: "PDF must be under 10MB." };
  }

  const service = createServiceClient();
  if (!service) return { error: "Storage not configured." };

  const path = `${committeeId}/${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await service.storage
    .from("study-guides")
    .upload(path, buffer, { contentType: "application/pdf", upsert: true });

  if (uploadError) return { error: uploadError.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("committees")
    .update({ study_guide_path: path, updated_at: new Date().toISOString() })
    .eq("id", committeeId);

  if (error) return { error: error.message };

  revalidatePath("/admin/committees");
  revalidatePath("/committees");
  return { success: "Study guide uploaded" };
}

export async function removeStudyGuideAction(committeeId: string) {
  await requireAdminUser();

  const supabase = await createClient();
  const { data: committee } = await supabase
    .from("committees")
    .select("study_guide_path")
    .eq("id", committeeId)
    .single();

  if (committee?.study_guide_path) {
    const service = createServiceClient();
    await service?.storage
      .from("study-guides")
      .remove([committee.study_guide_path]);
  }

  await supabase
    .from("committees")
    .update({ study_guide_path: null, updated_at: new Date().toISOString() })
    .eq("id", committeeId);

  revalidatePath("/admin/committees");
  return { success: "Study guide removed" };
}
