import type { Sponsor } from "@/lib/types/admin";

export const SPONSOR_TIER_LABELS: Record<Sponsor["tier"], string> = {
  platinum: "Platinum Sponsor",
  gold: "Gold Sponsor",
  silver: "Silver Sponsor",
  partner: "Partner",
};

export function getSponsorTierLabel(tier: Sponsor["tier"]) {
  return SPONSOR_TIER_LABELS[tier];
}
