import "../people.css";

import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { SealLine } from "@/components/seal-line";
import {
  PortraitPlate,
  initialsFromName,
} from "@/components/secretariat-portrait";
import {
  fetchPublishedEbMembers,
  getPublicStorageUrl,
} from "@/lib/public/queries";

export default async function ExecutiveBoardPage() {
  const members = await fetchPublishedEbMembers();
  const founders = members.filter((member) => member.is_founder);
  const boardMembers = members.filter((member) => !member.is_founder);
  const rosterIndex = String(members.length).padStart(2, "0");

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
              {members.length > 0 ? `Roster · ${rosterIndex}` : "Roster · Pending"}
            </span>
          </div>
          <h1 className="hall-title">Executive Board</h1>
          <p className="hall-lede">
            {members.length > 0
              ? "The board that runs Munique. Strategy, operations, and the standard of the floor — accountable for Edition I end to end."
              : "The board that runs Munique. Names are gazetted here the moment they are confirmed."}
          </p>
        </div>
      </section>

      {founders.length > 0 && (
        <section className="sheet ppl-section" aria-label="Founder">
          <div className="ppl-feature-stack">
            {founders.map((member, index) => {
              const portraitUrl = member.portrait_path
                ? getPublicStorageUrl("eb-portraits", member.portrait_path)
                : null;

              return (
                <Reveal key={member.id} delay={index * 90}>
                  <article className="ppl-feature">
                    <div className="ppl-portrait ppl-feature-media">
                      {portraitUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={portraitUrl}
                            alt={`Portrait of ${member.full_name}`}
                            width={900}
                            height={1125}
                          />
                          <span className="ppl-duotone" aria-hidden />
                        </>
                      ) : (
                        <div className="ppl-monogram" aria-hidden>
                          <span className="ppl-monogram-letters">
                            {initialsFromName(member.full_name)}
                          </span>
                          <span className="ppl-monogram-note">
                            Portrait to follow
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ppl-feature-body">
                      <div className="ppl-feature-tags">
                        <span className="tag tag-dark">Founder</span>
                        <span className="tag tag-dark">Executive Board</span>
                      </div>
                      <h2 className="display display-lg ppl-feature-name">
                        {member.full_name}
                      </h2>
                      {member.role_title ? (
                        <p className="mono-label mono-label-dark">
                          {member.role_title}
                        </p>
                      ) : null}
                      {member.description ? (
                        <p className="ppl-feature-desc">{member.description}</p>
                      ) : null}
                    </div>
                    <SealLine
                      className="ppl-feature-seal"
                      aria-hidden
                      focusable="false"
                    />
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {boardMembers.length > 0 && (
        <section className="sheet ppl-section" aria-label="Executive Board members">
          <div className="ppl-section-head">
            <h2 className="mono-label">The board</h2>
            <p className="mono-label">
              {boardMembers.length} officer{boardMembers.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="ppl-roster">
            {boardMembers.map((member, index) => {
              const portraitUrl = member.portrait_path
                ? getPublicStorageUrl("eb-portraits", member.portrait_path)
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
                    description={member.description}
                    portraitUrl={portraitUrl}
                  />
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {members.length === 0 && (
        <section className="sheet ppl-section" aria-label="Roster status">
          <Reveal>
            <div className="plate plate-tinted ppl-empty">
              <p className="mono-label">Awaiting publication</p>
              <p className="ppl-stamp">The board will be gazetted here.</p>
            </div>
          </Reveal>
        </section>
      )}

      <nav className="sheet ppl-section ppl-cross" aria-label="Continue">
        <ul className="ledger">
          <li className="ledger-row">
            <Link href="/secretariat" className="ledger-link ppl-cross-link">
              <span className="mono-label ppl-cross-kicker">
                Committee officers
              </span>
              <span className="display display-sm ppl-cross-title">
                The Secretariat
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
