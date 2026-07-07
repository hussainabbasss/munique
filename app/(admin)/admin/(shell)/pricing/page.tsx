import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/helpers";
import { PricingForm } from "@/components/admin/pricing-form";
import type { PricingConfig } from "@/lib/types/admin";

export default async function PricingPage() {
  const admin = await getAdminUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("pricing_config")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  return (
    <section className="admin-panel">
      <h1 className="admin-panel-title">Pricing</h1>
      <PricingForm
        config={data as PricingConfig | null}
        canEdit={admin?.role === "admin"}
      />
    </section>
  );
}
