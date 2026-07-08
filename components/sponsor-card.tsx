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
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={sponsor.name}
          className="home-partner-logo"
        />
      ) : (
        <span className="home-partner-name">{sponsor.name}</span>
      )}
      <span className="home-partner-tier">{tierLabel}</span>
    </>
  );

  if (sponsor.website_url) {
    return (
      <a
        href={sponsor.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className="home-partner-cell"
      >
        {content}
      </a>
    );
  }

  return <div className="home-partner-cell">{content}</div>;
}
