import "../people.css";

import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { SealLine } from "@/components/seal-line";
import { PortraitPlate } from "@/components/secretariat-portrait";
import {
  fetchPublishedSecretariat,
  getPublicStorageUrl,
} from "@/lib/public/queries";

export default async function SecretariatPage() {
  const members = await fetchPublishedSecretariat();
  const benchIndex = String(members.length).padStart(2, "0");
  const committeeCount = new Set(
    members
      .map((member) => member.committees?.id)
      .filter((id): id is string => Boolean(id)),
  ).size;

  return (
    <main id="main">
      <section className="hall">
        <div className="hall-arcs" aria-hidden="true">
          <SealLine className="ppl-hall-seal" aria-hidden focusable="false" />
        </div>
        <div className="hall-inner">
          <div className="hall-meta">
            <span>Munique ’26</span>
            <span>Officers of the conference</span>
            <span>
              {members.length > 0 ? `Bench · ${benchIndex}` : "Bench · Pending"}
            </span>
          </div>
          <h1 className="hall-title">The Secretariat</h1>
          <p className="hall-lede">
            {members.length > 0
              ? "Chairs and directors for every committee room. The bench that keeps debate moving through Edition I."
              : "Chairs and directors for every committee room. Officers are gazetted here as committees are confirmed."}
          </p>
        </div>
      </section>

      {members.length > 0 ? (
        <section className="sheet ppl-section" aria-label="Secretariat members">
          <div className="ppl-section-head">
            <h2 className="mono-label">The bench</h2>
            <p className="mono-label">
              {members.length} officer{members.length === 1 ? "" : "s"}
              {committeeCount > 0
                ? ` · ${committeeCount} committee${committeeCount === 1 ? "" : "s"}`
                : ""}
            </p>
          </div>
          <div className="ppl-roster">
            {members.map((member, index) => {
              const portraitUrl = member.portrait_path
                ? getPublicStorageUrl(
                    "secretariat-portraits",
                    member.portrait_path,
                  )
                : null;
              const wide = index % 5 === 0 || index % 5 === 1;

              return (
                <Reveal
                  key={member.id}
                  delay={(index % 3) * 90}
                  className={wide ? "ppl-cell ppl-cell--wide" : "ppl-cell"}
                >
                  <PortraitPlate
                    name={member.full_name}
                    role={member.role_title}
                    committee={member.committees?.name ?? null}
                    description={member.description}
                    portraitUrl={portraitUrl}
                  />
                </Reveal>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="sheet ppl-section" aria-label="Roster status">
          <Reveal>
            <div className="plate plate-tinted ppl-empty">
              <p className="mono-label">Awaiting publication</p>
              <p className="ppl-stamp">
                The Secretariat will be gazetted here.
              </p>
            </div>
          </Reveal>
        </section>
      )}

      <nav className="sheet ppl-section ppl-cross" aria-label="Continue">
        <ul className="ledger">
          <li className="ledger-row">
            <Link href="/eb" className="ledger-link ppl-cross-link">
              <span className="mono-label ppl-cross-kicker">Direction</span>
              <span className="display display-sm ppl-cross-title">
                Executive Board
              </span>
              <span className="ppl-cross-arrow" aria-hidden>
                →
              </span>
            </Link>
          </li>
          <li className="ledger-row">
            <Link href="/committees" className="ledger-link ppl-cross-link">
              <span className="mono-label ppl-cross-kicker">
                Agenda &amp; rooms
              </span>
              <span className="display display-sm ppl-cross-title">
                Committees
              </span>
              <span className="ppl-cross-arrow" aria-hidden>
                →
              </span>
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
