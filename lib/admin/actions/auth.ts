"use server";

import { redirect } from "next/navigation";
import { ensureAdminAccess } from "@/lib/admin/auth-link";
import { createClient } from "@/lib/supabase/server";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    redirect("/admin/login?error=missing");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const code =
      error.message.toLowerCase().includes("email not confirmed")
        ? "unconfirmed"
        : "invalid";
    redirect(`/admin/login?error=${code}`);
  }

  const user = data.user;
  if (!user?.email) {
    redirect("/admin/login?error=invalid");
  }

  const allowed = await ensureAdminAccess(user.id, user.email);
  if (!allowed) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=unauthorized");
  }

  redirect(next);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
