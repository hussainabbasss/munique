import Link from "next/link";
import { Reveal } from "@/components/reveal";
import {
  fetchPublishedCommittees,
  getPublicStorageUrl,
} from "@/lib/public/queries";
import "../program.css";

function HallArcs() {
  return (
    <svg
      className="hall-arcs"
      viewBox="0 0 1440 480"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="720" cy="640" r="240" opacity="0.35" />
        <circle cx="720" cy="640" r="360" opacity="0.28" />
        <circle cx="720" cy="640" r="480" opacity="0.22" />
        <circle cx="720" cy="640" r="600" opacity="0.16" />
      </g>
    </svg>
  );
}

export default async function CommitteesPage() {
  const committees = await fetchPublishedCommittees();

  return (
    <main id="main">
      <header className="hall">
        <HallArcs />
        <div className="hall-inner">
          <div className="hall-meta">
            <span>Munique ’26 · Edition I</span>
            <span>
              {committees.length > 0
                ? `${committees.length} ${
                    committees.length === 1 ? "chamber" : "chambers"
                  } gazetted`
                : "Docket pending"}
            </span>
            <span>250–300 delegates</span>
          </div>
          <h1 className="hall-title">Committees in session</h1>
          <p className="hall-lede">
            Agendas, briefings and study material for every chamber of
            Edition I. Read the docket. Choose your floor.
          </p>
          <div className="prog-hall-actions">
            <Link href="/secretariat" className="btn btn-sm btn-outline-dark">
              The Secretariat
            </Link>
            <Link href="/schedule" className="btn btn-sm btn-outline-dark">
              Order of proceedings
            </Link>
          </div>
        </div>
      </header>

      <section className="sheet prog-section" aria-label="Committee docket">
        {committees.length === 0 ? (
          <Reveal>
            <div className="plate plate-tinted prog-empty">
              <p className="mono-label">The docket</p>
              <p className="display display-sm prog-empty-line">
                Committees are gazetted as they are constituted.
              </p>
            </div>
          </Reveal>
        ) : (
          <>
            <div className="prog-ledger-head">
              <p className="mono-label">The docket</p>
              <p className="mono-label">
                {committees.length}{" "}
                {committees.length === 1 ? "entry" : "entries"}
              </p>
            </div>
            <ul className="ledger">
              {committees.map((c, i) => {
                const guideUrl = c.study_guide_path
                  ? getPublicStorageUrl("study-guides", c.study_guide_path)
                  : null;
                const logoUrl = c.logo_path
                  ? getPublicStorageUrl("committee-logos", c.logo_path)
                  : null;

                return (
                  <li key={c.id} className="ledger-row prog-row">
                    <Reveal delay={Math.min(i, 4) * 70}>
                      <div className="prog-row-grid">
                        <div className="prog-plate">
                          {logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={logoUrl}
                              alt={`${c.name} logo`}
                              width={96}
                              height={96}
                            />
                          ) : (
                            <span className="prog-plate-abbr" aria-hidden>
                              {c.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="prog-row-top">
                            <h2 className="display display-md prog-name">
                              {c.name}
                            </h2>
                            <div className="prog-tags">
                              <span className="tag">
                                {c.difficulty_tier} intensity
                              </span>
                            </div>
                          </div>
                          {c.short_description && (
                            <p className="prose-lede prog-desc">
                              {c.short_description}
                            </p>
                          )}
                          {c.agenda && (
                            <div className="prog-agenda">
                              <p className="mono-label">Agenda</p>
                              <p className="prose-body">{c.agenda}</p>
                            </div>
                          )}
                          <div className="prog-actions">
                            {guideUrl && c.study_guide_enabled ? (
                              <a
                                href={guideUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-cobalt"
                              >
                                Download study guide
                              </a>
                            ) : (
                              <span className="prog-guide-pending">
                                Study guide — releasing soon
                              </span>
                            )}
                            <Link
                              href="/secretariat"
                              className="btn btn-sm btn-outline"
                            >
                              View secretariat chairs
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <div className="sheet prog-foot">
        <Link href="/" className="arrow-cta prog-back">
          <span className="arrow" aria-hidden>
            ←
          </span>
          Back to the floor
        </Link>
      </div>
    </main>
  );
}
