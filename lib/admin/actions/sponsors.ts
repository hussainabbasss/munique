"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/admin/helpers";

async function uploadSponsorLogo(
  sponsorId: string,
  file: File,
): Promise<{ error?: string }> {
  const allowed = ["image/png", "image/svg+xml", "image/webp"];
  if (!allowed.includes(file.type)) {
    return { error: "Logo must be PNG, SVG, or WebP." };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { error: "Logo must be under 2MB." };
  }

  const service = createServiceClient();
  if (!service) return { error: "Storage not configured." };

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${sponsorId}/logo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await service.storage
    .from("sponsor-logos")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return { error: uploadError.message };

  const supabase = await createClient();
  await supabase.from("sponsors").update({ logo_path: path }).eq("id", sponsorId);

  return {};
}

export async function saveSponsorAction(formData: FormData) {
  await requireAdminUser();

  const id = String(formData.get("id") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  const tier = String(formData.get("tier") ?? "partner");
  const websiteUrl = String(formData.get("website_url") ?? "") || null;
  const displayOrder = parseInt(String(formData.get("display_order") ?? "0"), 10);
  const isPublished = formData.get("is_published") === "on";
  const isDigitalPartner = formData.get("is_digital_partner") === "on";
  const logoFile = formData.get("logo") as File | null;

  if (!name) return { error: "Name is required." };

  const payload = {
    name,
    tier,
    website_url: websiteUrl,
    display_order: displayOrder,
    is_published: isPublished,
    is_digital_partner: isDigitalPartner,
  };

  const supabase = await createClient();
  let sponsorId = id;

  if (id) {
    const { error } = await supabase.from("sponsors").update(payload).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { data: inserted, error } = await supabase
      .from("sponsors")
      .insert(payload)
      .select("id")
      .single();
    if (error || !inserted) return { error: error?.message ?? "Could not save sponsor." };
    sponsorId = inserted.id;
  }

  if (logoFile?.size && sponsorId) {
    const uploadResult = await uploadSponsorLogo(sponsorId, logoFile);
    if (uploadResult.error) return { error: uploadResult.error };
  }

  revalidatePath("/admin/sponsors");
  revalidatePath("/");
  return { success: "Sponsor saved" };
}

export async function uploadSponsorLogoAction(formData: FormData) {
  await requireAdminUser();

  const sponsorId = String(formData.get("sponsor_id") ?? "");
  const file = formData.get("file") as File | null;

  if (!sponsorId || !file?.size) {
    return { error: "Select a logo file." };
  }

  const result = await uploadSponsorLogo(sponsorId, file);
  if (result.error) return { error: result.error };

  revalidatePath("/admin/sponsors");
  return { success: "Logo uploaded" };
}

export async function deleteSponsorAction(sponsorId: string) {
  await requireAdminUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("sponsors")
    .select("logo_path")
    .eq("id", sponsorId)
    .single();

  if (data?.logo_path) {
    const service = createServiceClient();
    await service?.storage.from("sponsor-logos").remove([data.logo_path]);
  }

  await supabase.from("sponsors").delete().eq("id", sponsorId);

  revalidatePath("/admin/sponsors");
  revalidatePath("/");
  return { success: "Sponsor deleted" };
}
