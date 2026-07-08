import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/admin/helpers";
import type { Committee, EbMember, SecretariatMember, Sponsor } from "@/lib/types/admin";

export type SecretariatMemberWithCommittee = SecretariatMember & {
  committees: Pick<Committee, "id" | "name"> | null;
};

export async function fetchPublishedCommittees(): Promise<Committee[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("committees")
    .select("*")
    .eq("is_published", true)
    .order("display_order");

  return (data ?? []) as Committee[];
}

export async function fetchPublishedSponsors(): Promise<Sponsor[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("sponsors")
    .select("*")
    .eq("is_published", true)
    .order("display_order");

  return (data ?? []) as Sponsor[];
}

export function getPublicStorageUrl(bucket: string, path: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  return `${url}/storage/v1/object/public/${bucket}/${path}`;
}

export async function fetchPublishedSecretariat(): Promise<SecretariatMemberWithCommittee[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("secretariat_members")
    .select("*, committees(id,name)")
    .eq("is_published", true)
    .order("display_order");

  return (data ?? []) as SecretariatMemberWithCommittee[];
}

export async function fetchPublishedEbMembers(): Promise<EbMember[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("eb_members")
    .select("*")
    .eq("is_published", true)
    .order("display_order");

  return (data ?? []) as EbMember[];
}
