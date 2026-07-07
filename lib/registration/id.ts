import type { SupabaseClient } from "@supabase/supabase-js";

const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSuffix(length = 4) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  }
  return result;
}

export async function generateRegistrationId(
  supabase: SupabaseClient,
  maxAttempts = 12,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const registrationId = `MUN-${randomSuffix()}`;
    const { data } = await supabase
      .from("registrations")
      .select("id")
      .eq("registration_id", registrationId)
      .maybeSingle();

    if (!data) return registrationId;
  }

  throw new Error("Could not generate a unique registration ID.");
}
