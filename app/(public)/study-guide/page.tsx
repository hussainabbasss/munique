import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { SealLine } from "@/components/seal-line";
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

export default async function StudyGuidePage() {
  const committees = await fetchPublishedCommittees();
  const filed = committees.filter(
    (c) => c.study_guide_enabled && c.study_guide_path,
  ).length;

  return (
    <main id="main">
      <header className="hall">
        <HallArcs />
        <div className="hall-inner">
          <div className="hall-meta">
            <span>Munique ’26 · Edition I</span>
            <span>Document ledger</span>
            <span>
              {committees.length > 0
                ? `${filed} of ${committees.length} guides filed`
                : "Awaiting first filing"}
            </span>
          </div>
          <h1 className="hall-title">The record</h1>
          <p className="hall-lede">
            Every committee files a study guide to the record before sessions
            convene. Downloads issue from the ledger below.
          </p>
        </div>
      </header>

      <section className="sheet prog-section" aria-label="Study guide ledger">
        {committees.length === 0 ? (
          <Reveal>
            <div className="prog-ink">
              <div className="prog-ink-meta">
                <span>Official notice</span>
                <span className="tag tag-dark">Status · Pending</span>
              </div>
              <h2 className="display prog-ink-line">
                Guides enter the record before committees convene.
              </h2>
              <p className="prog-ink-copy">
                Study guides are published to this ledger as committees are
                constituted. Consult the docket for the chambers of Edition I.
              </p>
              <div className="prog-ink-actions">
                <Link href="/committees" className="btn btn-sm btn-signal">
                  View the committees
                </Link>
              </div>
              <SealLine aria-hidden className="prog-ink-seal" />
            </div>
          </Reveal>
        ) : (
          <>
            <div className="prog-ledger-head">
              <p className="mono-label">Document ledger</p>
              <p className="mono-label">
                {filed} filed · {committees.length - filed} pending
              </p>
            </div>
            <ul className="ledger">
              {committees.map((c, i) => {
                const guideUrl =
                  c.study_guide_enabled && c.study_guide_path
                    ? getPublicStorageUrl("study-guides", c.study_guide_path)
                    : null;

                return (
                  <li key={c.id} className="ledger-row">
                    <Reveal delay={Math.min(i, 4) * 70}>
                      <div className="prog-doc-row">
                        <span className="prog-doc-index" aria-hidden>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h2 className="display display-sm prog-doc-title">
                            {c.name}
                          </h2>
                          <p className="prog-doc-sub">
                            {c.difficulty_tier} intensity
                          </p>
                        </div>
                        <div className="prog-doc-status">
                          {guideUrl ? (
                            <a
                              href={guideUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-ink"
                            >
                              Download
                              <span className="sr-only">
                                {` ${c.name} study guide`}
                              </span>
                            </a>
                          ) : (
                            <span className="tag">Pending</span>
                          )}
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
