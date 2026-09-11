import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin/helpers";

export type ProfileAllotment = {
  id: string;
  delegate_id: string;
  country: string | null;
  merit_score: number | null;
  status: string;
  is_override: boolean;
  committee_name: string | null;
};

export type ProfileDelegate = {
  id: string;
  full_name: string;
  email: string | null;
  is_head_delegate: boolean;
  display_order: number;
  mun_experience: string;
  committee_pref_1: string | null;
  committee_pref_2: string | null;
  committee_pref_3: string | null;
  pref1_name: string | null;
  pref2_name: string | null;
  pref3_name: string | null;
  allotment: ProfileAllotment | null;
};

export type RegistrationProfile = {
  id: string;
  registration_id: string;
  type: "delegate" | "delegation";
  payment_status: string;
  fee_amount: number;
  school: string;
  head_email: string;
  brand_ambassador_name: string | null;
  mun_experience: string;
  created_at: string;
  payment_proof_path: string | null;
  registration_email_sent_at: string | null;
  payment_email_sent_at: string | null;
  delegates: ProfileDelegate[];
};

type PrefJoin = { name: string } | null;

type DelegateQueryRow = {
  id: string;
  full_name: string;
  email: string | null;
  is_head_delegate: boolean;
  display_order: number;
  mun_experience: string | null;
  committee_pref_1: string | null;
  committee_pref_2: string | null;
  committee_pref_3: string | null;
  pref1: PrefJoin;
  pref2: PrefJoin;
  pref3: PrefJoin;
};

type AllotmentQueryRow = {
  id: string;
  delegate_id: string;
  country: string | null;
  merit_score: number | null;
  status: string;
  is_override: boolean;
  committees: { name: string } | null;
};

export async function fetchRegistrationProfile(
  registrationUuid: string,
): Promise<{ profile: RegistrationProfile } | { error: string }> {
  await requireAdminUser();
  const supabase = await createClient();

  const { data: registration, error } = await supabase
    .from("registrations")
    .select(
      `
      id,
      registration_id,
      type,
      payment_status,
      fee_amount,
      school,
      head_email,
      brand_ambassador_name,
      mun_experience,
      created_at,
      payment_proof_path,
      registration_email_sent_at,
      payment_email_sent_at,
      delegates(
        id,
        full_name,
        email,
        is_head_delegate,
        display_order,
        mun_experience,
        committee_pref_1,
        committee_pref_2,
        committee_pref_3,
        pref1:committees!delegates_committee_pref_1_fkey(name),
        pref2:committees!delegates_committee_pref_2_fkey(name),
        pref3:committees!delegates_committee_pref_3_fkey(name)
      )
    `,
    )
    .eq("id", registrationUuid)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!registration) return { error: "Registration not found." };

  const { data: allotments } = await supabase
    .from("allotments")
    .select(
      "id, delegate_id, country, merit_score, status, is_override, committees(name)",
    )
    .eq("registration_id", registrationUuid);

  const allotmentByDelegate = new Map<string, ProfileAllotment>();
  for (const row of (allotments ?? []) as unknown as AllotmentQueryRow[]) {
    allotmentByDelegate.set(row.delegate_id, {
      id: row.id,
      delegate_id: row.delegate_id,
      country: row.country,
      merit_score: row.merit_score,
      status: row.status,
      is_override: row.is_override,
      committee_name: row.committees?.name ?? null,
    });
  }

  const delegates = (
    (registration.delegates ?? []) as unknown as DelegateQueryRow[]
  )
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((delegate) => ({
      id: delegate.id,
      full_name: delegate.full_name,
      email: delegate.email,
      is_head_delegate: delegate.is_head_delegate,
      display_order: delegate.display_order,
      mun_experience: delegate.mun_experience ?? "",
      committee_pref_1: delegate.committee_pref_1,
      committee_pref_2: delegate.committee_pref_2,
      committee_pref_3: delegate.committee_pref_3,
      pref1_name: delegate.pref1?.name ?? null,
      pref2_name: delegate.pref2?.name ?? null,
      pref3_name: delegate.pref3?.name ?? null,
      allotment: allotmentByDelegate.get(delegate.id) ?? null,
    }));

  return {
    profile: {
      id: registration.id,
      registration_id: registration.registration_id,
      type: registration.type as "delegate" | "delegation",
      payment_status: registration.payment_status,
      fee_amount: registration.fee_amount,
      school: registration.school,
      head_email: registration.head_email,
      brand_ambassador_name: registration.brand_ambassador_name,
      mun_experience: registration.mun_experience,
      created_at: registration.created_at,
      payment_proof_path: registration.payment_proof_path,
      registration_email_sent_at: registration.registration_email_sent_at,
      payment_email_sent_at: registration.payment_email_sent_at,
      delegates,
    },
  };
}
