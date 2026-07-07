import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/admin/helpers";
import type { PricingConfig } from "@/lib/types/admin";

export async function fetchActivePricing(): Promise<PricingConfig | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("pricing_config")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  return (data as PricingConfig | null) ?? null;
}
