import "./home.css";

import { ConferenceFacts } from "@/components/conference-facts";
import { EbReveal } from "@/components/eb-reveal";
import { ExploreGrid } from "@/components/explore-grid";
import { Hero } from "@/components/hero";
import { Reveal } from "@/components/reveal";
import { SponsorCard } from "@/components/sponsor-card";
import { fetchPublishedSponsors } from "@/lib/public/queries";

export default async function Home() {
  const sponsors = await fetchPublishedSponsors();
  const tbaCount =
    sponsors.length === 0 ? 4 : (4 - (sponsors.length % 4)) % 4;

  return (
    <main id="main" className="home-main">
      <Hero />
      <ConferenceFacts />
      <ExploreGrid />
      <EbReveal />

      <section className="home-partners" aria-labelledby="partners-title">
        <div className="sheet">
          <Reveal>
            <div className="home-partners-head">
              <h2
                id="partners-title"
                className="display display-md home-partners-title"
              >
                Partners
              </h2>
              <p className="home-partners-note">
                {sponsors.length
                  ? "The partners of Edition I."
                  : "Partnerships are in procedure. Logos publish as agreements are signed."}
              </p>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div className="home-partners-grid">
              {sponsors.map((sponsor) => (
                <SponsorCard key={sponsor.id} sponsor={sponsor} />
              ))}
              {Array.from({ length: tbaCount }, (_, index) => (
                <div
                  key={`tba-${index}`}
                  className="home-partner-cell home-partner-tba"
                >
                  <span className="home-partner-tba-box" aria-hidden>
                    TBA
                  </span>
                  <span className="sr-only">Partner to be announced</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
