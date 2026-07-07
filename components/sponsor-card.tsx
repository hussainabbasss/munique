import { getSponsorLogoUrl } from "@/lib/sponsors/logo";
import { getSponsorTierLabel } from "@/lib/sponsors/tier";
import type { Sponsor } from "@/lib/types/admin";

type Props = {
  sponsor: Sponsor;
};

export function SponsorCard({ sponsor }: Props) {
  const logoUrl = getSponsorLogoUrl(sponsor);
  const tierLabel = getSponsorTierLabel(sponsor.tier);

  const content = (
    <>
      <span className={`sponsor-card-tier sponsor-card-tier-${sponsor.tier}`}>
        {tierLabel}
      </span>
      <div className="sponsor-card-logo">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={sponsor.name}
            className="sponsor-card-logo-img"
          />
        ) : (
          <span className="sponsor-card-name">{sponsor.name}</span>
        )}
      </div>
    </>
  );

  if (sponsor.website_url) {
    return (
      <a
        href={sponsor.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className="sponsor-card"
      >
        {content}
      </a>
    );
  }

  return <div className="sponsor-card">{content}</div>;
}
