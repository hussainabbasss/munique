import { ConferenceFacts } from "@/components/conference-facts";
import { ExploreGrid } from "@/components/explore-grid";
import { Hero } from "@/components/hero";
import { SecretariatPreview } from "@/components/secretariat-portrait";
import {
  fetchPublishedSponsors,
  getPublicStorageUrl,
} from "@/lib/public/queries";

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
              ? sponsors.map((s) => {
                  const logoUrl = s.logo_path
                    ? getPublicStorageUrl("sponsor-logos", s.logo_path)
                    : null;

                  const inner = logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt={s.name}
                      className="max-h-12 max-w-full object-contain"
                    />
                  ) : (
                    <span className="font-mono text-[0.6875rem] uppercase tracking-widest text-ink-navy-soft">
                      {s.name}
                    </span>
                  );

                  return s.website_url ? (
                    <a
                      key={s.id}
                      href={s.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sponsor-slot"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div key={s.id} className="sponsor-slot">
                      {inner}
                    </div>
                  );
                })
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
