import { createServiceClient } from "@/lib/supabase/admin";

/** Link auth.users → admin_users by email (service role). Returns false if no allowlist row. */
export async function ensureAdminAccess(
  authUserId: string,
  email: string,
): Promise<boolean> {
  const service = createServiceClient();
  if (!service) return false;

  const normalizedEmail = email.trim().toLowerCase();

  const { data: admin } = await service
    .from("admin_users")
    .select("id, auth_user_id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (!admin) return false;

  if (admin.auth_user_id !== authUserId) {
    const { error } = await service
      .from("admin_users")
      .update({ auth_user_id: authUserId })
      .eq("id", admin.id);

    if (error) return false;
  }

  return true;
}

/** Create auth user + admin_users row (first-time setup only). */
export async function bootstrapAdminUser(params: {
  email: string;
  password: string;
  fullName: string;
}) {
  const service = createServiceClient();
  if (!service) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  const email = params.email.trim().toLowerCase();

  const { data: existingAdmin } = await service
    .from("admin_users")
    .select("id, auth_user_id")
    .eq("email", email)
    .maybeSingle();

  let authUserId = existingAdmin?.auth_user_id ?? null;

  if (!authUserId) {
    const { data: authData, error: authError } =
      await service.auth.admin.createUser({
        email,
        password: params.password,
        email_confirm: true,
        user_metadata: { full_name: params.fullName },
      });

    if (authError) {
      // User may already exist in Auth — look up by email
      const { data: listData } = await service.auth.admin.listUsers();
      const existing = listData.users.find(
        (u) => u.email?.toLowerCase() === email,
      );

      if (!existing) throw authError;

      authUserId = existing.id;

      await service.auth.admin.updateUserById(existing.id, {
        password: params.password,
        email_confirm: true,
      });
    } else {
      authUserId = authData.user.id;
    }
  }

  if (existingAdmin) {
    await service
      .from("admin_users")
      .update({
        auth_user_id: authUserId,
        full_name: params.fullName,
      })
      .eq("id", existingAdmin.id);
  } else {
    const { error: insertError } = await service.from("admin_users").insert({
      email,
      full_name: params.fullName,
      role: "admin",
      auth_user_id: authUserId,
    });

    if (insertError) throw insertError;
  }

  return { email, authUserId };
}
