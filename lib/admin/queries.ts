import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/admin/helpers";
import type { DailyRegistrationCount, OverviewStats } from "@/lib/types/admin";

const EMPTY_STATS: OverviewStats = {
  totalDelegates: 0,
  totalRegistrations: 0,
  delegateCount: 0,
  delegationCount: 0,
  paymentPending: 0,
  paymentConfirmed: 0,
  totalAmount: 0,
  openQueries: 0,
};

export async function fetchOverviewStats(): Promise<OverviewStats> {
  if (!isSupabaseConfigured()) return EMPTY_STATS;

  const supabase = await createClient();

  const [
    { count: totalDelegates },
    { data: typeRows },
    { count: paymentPending },
    { count: paymentConfirmed },
    { data: confirmedFees },
    { count: openQueries },
  ] = await Promise.all([
    supabase.from("delegates").select("*", { count: "exact", head: true }),
    supabase.from("registrations").select("type"),
    supabase
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("payment_status", "pending"),
    supabase
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("payment_status", "confirmed"),
    supabase
      .from("registrations")
      .select("fee_amount")
      .eq("payment_status", "confirmed"),
    supabase
      .from("queries")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
  ]);

  const delegateCount =
    typeRows?.filter((r) => r.type === "delegate").length ?? 0;
  const delegationCount =
    typeRows?.filter((r) => r.type === "delegation").length ?? 0;

  return {
    totalDelegates: totalDelegates ?? 0,
    totalRegistrations: typeRows?.length ?? 0,
    delegateCount,
    delegationCount,
    paymentPending: paymentPending ?? 0,
    paymentConfirmed: paymentConfirmed ?? 0,
    totalAmount:
      confirmedFees?.reduce((sum, r) => sum + (r.fee_amount ?? 0), 0) ?? 0,
    openQueries: openQueries ?? 0,
  };
}

export async function fetchRegistrationChartData(): Promise<
  DailyRegistrationCount[]
> {
  if (!isSupabaseConfigured()) {
    return buildEmptyChart();
  }

  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 29);

  const { data } = await supabase
    .from("registrations")
    .select("created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  const counts = new Map<string, number>();

  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    counts.set(d.toISOString().slice(0, 10), 0);
  }

  for (const row of data ?? []) {
    const date = new Date(row.created_at).toLocaleDateString("en-CA", {
      timeZone: "Asia/Karachi",
    });
    if (counts.has(date)) {
      counts.set(date, (counts.get(date) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}

function buildEmptyChart(): DailyRegistrationCount[] {
  const result: DailyRegistrationCount[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    result.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  return result;
}
