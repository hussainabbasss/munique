import type { Sponsor } from "@/lib/types/admin";
import { getPublicStorageUrl } from "@/lib/public/queries";

export const SYSTEM_SUMMIT_SPONSOR_NAME = "System Summit";
export const SYSTEM_SUMMIT_LOGO_PATH = "/system-summit.png";

export function isSystemSummitSponsor(
  sponsor: Pick<Sponsor, "name" | "is_permanent">,
) {
  return sponsor.is_permanent || sponsor.name === SYSTEM_SUMMIT_SPONSOR_NAME;
}

export function getSponsorLogoUrl(
  sponsor: Pick<Sponsor, "name" | "logo_path" | "is_permanent" | "is_digital_partner">,
): string | null {
  if (isSystemSummitSponsor(sponsor)) {
    return SYSTEM_SUMMIT_LOGO_PATH;
  }

  if (sponsor.logo_path) {
    return getPublicStorageUrl("sponsor-logos", sponsor.logo_path);
  }

  return null;
}
