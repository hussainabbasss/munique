import { ConferenceFacts } from "@/components/conference-facts";
import { ExploreGrid } from "@/components/explore-grid";
import { Hero } from "@/components/hero";
import { SecretariatPreview } from "@/components/secretariat-portrait";
import { SponsorCard } from "@/components/sponsor-card";
import { fetchPublishedSponsors } from "@/lib/public/queries";

const sponsorPlaceholders = [
  "Partner I",
  "Partner II",
  "Partner III",
  "Partner IV",
];

export default async function Home() {
  const sponsors = await fetchPublishedSponsors();

  return (
    <main id="main" className="home-main">
      <Hero />
      <ConferenceFacts />
      <ExploreGrid />
      <SecretariatPreview />

      <section
        className="sponsors-section"
        aria-labelledby="sponsors-title"
      >
        <div className="mx-auto max-w-[1280px]">
          <h2 id="sponsors-title" className="section-title text-ink-navy">
            Sponsors &amp; Partners
          </h2>
          <p className="section-lead text-sm">
            {sponsors.length
              ? "Our partners for Edition I."
              : "Partner logos publish as agreements finalize."}
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {sponsors.length > 0
              ? sponsors.map((s) => <SponsorCard key={s.id} sponsor={s} />)
              : sponsorPlaceholders.map((name) => (
                  <div
                    key={name}
                    className="sponsor-slot"
                    aria-label={`${name} — logo TBA`}
                  >
                    TBA
                  </div>
                ))}
          </div>
        </div>
      </section>
    </main>
  );
}
