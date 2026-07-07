"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { requireAdminRole, requireAdminUser } from "@/lib/admin/helpers";

export async function createTeamMemberAction(formData: FormData) {
  await requireAdminRole();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "reviewer");

  if (!email || !fullName) {
    return { error: "Email and name are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (role !== "admin" && role !== "reviewer" && role !== "registration_staff") {
    return { error: "Invalid role." };
  }

  const service = createServiceClient();
  if (!service) {
    return { error: "Auth service is not configured." };
  }

  const { data: existing } = await service
    .from("admin_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return { error: "This email is already on the team." };
  }

  const { data: created, error: createError } =
    await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  let authUserId: string | null = created?.user?.id ?? null;

  if (createError) {
    const { data: listData } = await service.auth.admin.listUsers();
    const existingAuth = listData.users.find(
      (user) => user.email?.toLowerCase() === email,
    );

    if (!existingAuth) {
      return { error: createError.message };
    }

    authUserId = existingAuth.id;
    const { error: updateError } = await service.auth.admin.updateUserById(
      existingAuth.id,
      { password, email_confirm: true },
    );

    if (updateError) {
      return { error: updateError.message };
    }
  }

  if (!authUserId) {
    return { error: "Could not create login for this team member." };
  }

  const { error: insertError } = await service.from("admin_users").insert({
    email,
    full_name: fullName,
    role,
    auth_user_id: authUserId,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/admin/team");
  return {
    success: `Team member added. Share the login details with ${email} manually.`,
  };
}

/** @deprecated Use createTeamMemberAction */
export const inviteTeamMemberAction = createTeamMemberAction;

export async function removeTeamMemberAction(memberId: string) {
  const admin = await requireAdminRole();
  const supabase = await createClient();

  if (memberId === admin.id) {
    return { error: "You cannot remove yourself." };
  }

  const { data: admins } = await supabase
    .from("admin_users")
    .select("id")
    .eq("role", "admin");

  const target = await supabase
    .from("admin_users")
    .select("role")
    .eq("id", memberId)
    .single();

  if (
    target.data?.role === "admin" &&
    (admins?.length ?? 0) <= 1
  ) {
    return { error: "Cannot remove the last admin." };
  }

  await supabase.from("admin_users").delete().eq("id", memberId);

  revalidatePath("/admin/team");
  return { success: "Team member removed" };
}

export async function resolveQueryAction(formData: FormData) {
  await requireAdminUser();

  const queryId = String(formData.get("query_id") ?? "");
  const adminNotes = String(formData.get("admin_notes") ?? "");

  const admin = await requireAdminUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("queries")
    .update({
      status: "resolved",
      admin_notes: adminNotes || null,
      resolved_at: new Date().toISOString(),
      resolved_by: admin.id,
    })
    .eq("id", queryId);

  if (error) return { error: error.message };

  revalidatePath("/admin/queries");
  revalidatePath("/admin");
  return { success: "Query marked resolved" };
}

export async function submitQueryAction(formData: FormData) {
  const submitterName = String(formData.get("submitter_name") ?? "").trim();
  const submitterEmail = String(formData.get("submitter_email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const registrationRef = String(formData.get("registration_id") ?? "").trim();

  if (!submitterName || !submitterEmail || !subject || !body) {
    return { error: "All fields are required." };
  }

  const service = createServiceClient();
  const supabase = service ?? (await createClient());

  let registrationId: string | null = null;
  if (registrationRef) {
    const { data } = await supabase
      .from("registrations")
      .select("id")
      .eq("registration_id", registrationRef.toUpperCase())
      .maybeSingle();
    registrationId = data?.id ?? null;
  }

  const { error } = await supabase.from("queries").insert({
    submitter_name: submitterName,
    submitter_email: submitterEmail,
    subject,
    body,
    registration_id: registrationId,
    status: "open",
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/queries");
  return { success: "Your query has been submitted. The EB will respond soon." };
}
