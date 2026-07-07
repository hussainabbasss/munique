#!/usr/bin/env node
/**
 * Bootstrap the first EB admin account.
 *
 * Usage:
 *   node scripts/bootstrap-admin.mjs you@eb.com "YourPassword" "Full Name"
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const val = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = val;
  }
}

const [email, password, fullName = "EB Admin"] = process.argv.slice(2);

if (!email || !password) {
  console.error(
    'Usage: node scripts/bootstrap-admin.mjs <email> "<password>" ["Full Name"]',
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const service = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const normalizedEmail = email.trim().toLowerCase();

async function main() {
  const { data: existingAdmin } = await service
    .from("admin_users")
    .select("id, auth_user_id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  let authUserId = existingAdmin?.auth_user_id ?? null;

  if (!authUserId) {
    const { data: created, error: createError } =
      await service.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

    if (createError) {
      const { data: listData } = await service.auth.admin.listUsers();
      const existing = listData.users.find(
        (u) => u.email?.toLowerCase() === normalizedEmail,
      );

      if (!existing) {
        console.error("Auth error:", createError.message);
        process.exit(1);
      }

      authUserId = existing.id;
      const { error: updateError } = await service.auth.admin.updateUserById(
        existing.id,
        { password, email_confirm: true },
      );
      if (updateError) {
        console.error("Could not reset password:", updateError.message);
        process.exit(1);
      }
      console.log("Auth user already existed — password reset.");
    } else {
      authUserId = created.user.id;
      console.log("Auth user created.");
    }
  } else {
    const { error: pwError } = await service.auth.admin.updateUserById(
      authUserId,
      { password, email_confirm: true },
    );
    if (pwError) {
      console.error("Could not update password:", pwError.message);
      process.exit(1);
    }
    console.log("Password updated for existing admin.");
  }

  if (existingAdmin) {
    await service
      .from("admin_users")
      .update({ auth_user_id: authUserId, full_name: fullName })
      .eq("id", existingAdmin.id);
  } else {
    const { error: insertError } = await service.from("admin_users").insert({
      email: normalizedEmail,
      full_name: fullName,
      role: "admin",
      auth_user_id: authUserId,
    });
    if (insertError) {
      console.error("admin_users insert error:", insertError.message);
      process.exit(1);
    }
  }

  console.log(`\nAdmin ready: ${normalizedEmail}`);
  console.log("Sign in at /admin/login with the password you provided.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
