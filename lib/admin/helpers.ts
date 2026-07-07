import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import type { AdminUser, StatusBannerSettings } from "@/lib/types/admin";

export { formatDate, formatPkr } from "@/lib/utils/format";

const DEFAULT_BANNER: StatusBannerSettings = {
  message: "REGISTRATION IS LIVE · REGISTER NOW →",
  href: "/register",
  visible: true,
};

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getSiteSetting<T>(key: string, fallback: T): Promise<T> {
  if (!isSupabaseConfigured()) return fallback;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (data?.value) return data.value as T;
  } catch {
    // Public site must not break
  }

  return fallback;
}

export async function getStatusBannerSettings(): Promise<StatusBannerSettings> {
  return getSiteSetting("status_banner", DEFAULT_BANNER);
}

export async function getAdminUser(): Promise<AdminUser | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("admin_users")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return data as AdminUser | null;
}

export async function requireAdminUser(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Unauthorized");
  }
  return admin;
}

export async function requireAdminRole(): Promise<AdminUser> {
  const admin = await requireAdminUser();
  if (admin.role !== "admin") {
    throw new Error("Forbidden");
  }
  return admin;
}

export function isRegistrationStaff(admin: AdminUser) {
  return admin.role === "registration_staff";
}

export async function requireRegistrationStaffOrAdmin(): Promise<AdminUser> {
  const admin = await requireAdminUser();
  if (admin.role !== "admin" && admin.role !== "registration_staff") {
    throw new Error("Forbidden");
  }
  return admin;
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600,
): Promise<string | null> {
  const service = createServiceClient();
  if (!service) return null;

  const { data } = await service.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  return data?.signedUrl ?? null;
}
