import Link from "next/link";
import { Reveal } from "@/components/reveal";
import {
  fetchPublishedEbMembers,
  getPublicStorageUrl,
} from "@/lib/public/queries";

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function EbReveal() {
  const members = (await fetchPublishedEbMembers()).slice(0, 4);

  return (
    <section className="home-board" aria-labelledby="board-title">
      <div className="sheet">
        <Reveal>
          <div className="home-board-head">
            <div>
              <h2 id="board-title" className="display display-lg home-board-title">
                The Executive Board
              </h2>
              <p className="home-board-lede">
                {members.length
                  ? "The officers presiding over Edition I."
                  : "Appointments are in procedure."}
              </p>
            </div>
            <Link href="/eb" className="btn btn-outline-dark">
              View the board
            </Link>
          </div>
        </Reveal>

        {members.length > 0 ? (
          <ul
            className="home-board-rail"
            aria-label="Executive Board members"
            tabIndex={0}
          >
            {members.map((member, index) => {
              const portraitUrl = member.portrait_path
                ? getPublicStorageUrl("eb-portraits", member.portrait_path)
                : null;

              return (
                <Reveal
                  key={member.id}
                  as="li"
                  delay={index * 80}
                  className="home-board-plate"
                >
                  <div className="home-board-portrait">
                    {portraitUrl ? (
                      <span className="home-duotone home-board-portrait-img">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={portraitUrl}
                          alt=""
                          className="home-board-portrait-img"
                          width={330}
                          height={440}
                        />
                      </span>
                    ) : (
                      <div className="home-board-monogram" aria-hidden>
                        {initialsFromName(member.full_name)}
                      </div>
                    )}
                  </div>
                  <div className="home-board-id">
                    <p className="home-board-name">{member.full_name}</p>
                    {member.role_title && (
                      <p className="home-board-role">{member.role_title}</p>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </ul>
        ) : (
          <Reveal delay={80}>
            <div className="home-board-empty">
              <p className="display display-sm home-board-empty-title">
                To be gazetted
              </p>
              <p className="home-board-empty-copy">
                The Executive Board of Edition I publishes here once
                appointments are confirmed.
              </p>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
