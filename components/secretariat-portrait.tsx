import "@/app/(public)/people.css";

import Link from "next/link";
import { Reveal } from "@/components/reveal";
import {
  fetchPublishedSecretariat,
  getPublicStorageUrl,
} from "@/lib/public/queries";
import type { SecretariatMemberWithCommittee } from "@/lib/public/queries";

export function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export type PortraitPlateProps = {
  name: string;
  role?: string | null;
  committee?: string | null;
  description?: string | null;
  portraitUrl: string | null;
};

/**
 * One officer in the editorial roster: duotone portrait (or display-type
 * monogram plate) above a hairline block of name / role / committee / note.
 * Shared by the Executive Board and Secretariat rosters.
 */
export function PortraitPlate({
  name,
  role,
  committee,
  description,
  portraitUrl,
}: PortraitPlateProps) {
  return (
    <article className="ppl-plate">
      <div className="ppl-portrait">
        {portraitUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portraitUrl}
              alt={`Portrait of ${name}`}
              width={640}
              height={800}
              loading="lazy"
            />
            <span className="ppl-duotone" aria-hidden />
          </>
        ) : (
          <div className="ppl-monogram" aria-hidden>
            <span className="ppl-monogram-letters">{initialsFromName(name)}</span>
            <span className="ppl-monogram-note">Portrait to follow</span>
          </div>
        )}
      </div>
      <div className="ppl-plate-body">
        <h3 className="display display-sm ppl-plate-name">{name}</h3>
        {role ? <p className="mono-label ppl-plate-role">{role}</p> : null}
        {committee ? (
          <p className="ppl-plate-tagrow">
            <span className="tag">{committee}</span>
          </p>
        ) : null}
        {description ? (
          <p className="prose-body ppl-plate-desc">{description}</p>
        ) : null}
      </div>
    </article>
  );
}

function MiniPortrait({ member }: { member: SecretariatMemberWithCommittee }) {
  const portraitUrl = member.portrait_path
    ? getPublicStorageUrl("secretariat-portraits", member.portrait_path)
    : null;

  return (
    <div className="ppl-mini">
      <div className="ppl-mini-portrait">
        {portraitUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portraitUrl}
              alt=""
              width={480}
              height={480}
              loading="lazy"
            />
            <span className="ppl-duotone" aria-hidden />
          </>
        ) : (
          <div className="ppl-monogram" aria-hidden>
            <span className="ppl-monogram-letters ppl-monogram-letters--sm">
              {initialsFromName(member.full_name)}
            </span>
          </div>
        )}
      </div>
      <p className="ppl-mini-name">{member.full_name}</p>
      {member.role_title ? (
        <p className="ppl-mini-role">{member.role_title}</p>
      ) : null}
    </div>
  );
}

/**
 * Ink-band secretariat preview for the home page: bench headline,
 * arrow link to the full roster, and a row of duotone mini portraits.
 */
export async function SecretariatPreview() {
  const members = await fetchPublishedSecretariat();
  const shown = members.slice(0, 8);

  return (
    <section className="ppl-preview" aria-labelledby="secretariat-preview-title">
      <div className="sheet ppl-preview-inner">
        <div className="ppl-preview-head">
          <div>
            <p className="mono-label mono-label-dark">
              Officers of the conference
            </p>
            <h2
              id="secretariat-preview-title"
              className="display display-md ppl-preview-title"
            >
              The Secretariat
            </h2>
          </div>
          <Link href="/secretariat" className="arrow-cta ppl-preview-link">
            Full secretariat
            <span className="arrow" aria-hidden>
              →
            </span>
          </Link>
        </div>

        {shown.length > 0 ? (
          <div className="ppl-preview-grid">
            {shown.map((member, index) => (
              <Reveal key={member.id} delay={(index % 4) * 80}>
                <MiniPortrait member={member} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="ppl-preview-empty">
            The bench is being seated. Officers publish here as committees
            confirm.
          </p>
        )}
      </div>
    </section>
  );
}
