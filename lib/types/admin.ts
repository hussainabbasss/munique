export type AdminRole = "admin" | "reviewer" | "registration_staff";

export type AdminUser = {
  id: string;
  auth_user_id: string | null;
  email: string;
  full_name: string;
  role: AdminRole;
  created_at: string;
};

export type StatusBannerSettings = {
  message: string;
  href: string;
  visible: boolean;
};

export type PricingConfig = {
  id: string;
  is_active: boolean;
  delegate_fee: number;
  delegation_fee: number;
  early_bird_enabled: boolean;
  early_bird_deadline: string | null;
  early_bird_delegate_fee: number | null;
  early_bird_delegation_fee: number | null;
  bank_account_title: string;
  bank_details: string;
  payment_instructions: string;
  updated_at: string;
};

export type Committee = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  agenda: string;
  difficulty_tier: "low" | "medium" | "high";
  study_guide_path: string | null;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Sponsor = {
  id: string;
  name: string;
  tier: "platinum" | "gold" | "silver" | "partner";
  logo_path: string | null;
  website_url: string | null;
  display_order: number;
  is_published: boolean;
  is_digital_partner: boolean;
  is_permanent: boolean;
  created_at: string;
};

export type RegistrationType = "delegate" | "delegation";
export type PaymentStatus = "pending" | "confirmed" | "rejected";

export type Registration = {
  id: string;
  registration_id: string;
  type: RegistrationType;
  portal: RegistrationType;
  payment_status: PaymentStatus;
  fee_amount: number;
  school: string;
  head_email: string;
  committee_pref_1: string | null;
  committee_pref_2: string | null;
  committee_pref_3: string | null;
  mun_experience: string;
  payment_proof_path: string | null;
  registration_email_sent_at: string | null;
  payment_email_sent_at: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
};

export type Delegate = {
  id: string;
  registration_id: string;
  full_name: string;
  email: string | null;
  is_head_delegate: boolean;
  display_order: number;
};

export type Allotment = {
  id: string;
  registration_id: string;
  merit_score: number | null;
  country: string | null;
  committee_id: string | null;
  status: "pending" | "issued";
  is_override: boolean;
  override_note: string | null;
  issued_at: string | null;
  issued_by: string | null;
  allotment_email_sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type QueryTicket = {
  id: string;
  ticket_number: number;
  registration_id: string | null;
  submitter_name: string;
  submitter_email: string;
  subject: string;
  body: string;
  status: "open" | "resolved";
  admin_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
};

export type OverviewStats = {
  totalDelegates: number;
  totalRegistrations: number;
  delegateCount: number;
  delegationCount: number;
  paymentPending: number;
  paymentConfirmed: number;
  totalAmount: number;
  openQueries: number;
};

export type DailyRegistrationCount = {
  date: string;
  count: number;
};

export type SecretariatMember = {
  id: string;
  full_name: string;
  role_title: string;
  portrait_path: string | null;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};
