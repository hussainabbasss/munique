import Link from "next/link";
import {
  fetchPublishedSecretariat,
  getPublicStorageUrl,
} from "@/lib/public/queries";
import type { SecretariatMember } from "@/lib/types/admin";

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function SecretariatPortrait({ member }: { member: SecretariatMember }) {
  const portraitUrl = member.portrait_path
    ? getPublicStorageUrl("secretariat-portraits", member.portrait_path)
    : null;

  return (
    <article className="secretariat-card">
      <div className="secretariat-ring">
        {portraitUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portraitUrl}
            alt=""
            className="secretariat-avatar secretariat-avatar-photo"
            width={120}
            height={120}
          />
        ) : (
          <div className="secretariat-avatar" aria-hidden>
            {initialsFromName(member.full_name)}
          </div>
        )}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold tracking-wide text-paper-white">
        {member.full_name}
      </h3>
      {member.role_title && (
        <p className="mt-1 text-sm text-parchment/70">{member.role_title}</p>
      )}
    </article>
  );
}

export async function SecretariatPreview() {
  const members = await fetchPublishedSecretariat();

  return (
    <section className="secretariat-section" aria-labelledby="secretariat-title">
      <div className="mx-auto max-w-[1280px] px-5 lg:px-10">
        <div className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2
              id="secretariat-title"
              className="section-title text-paper-white"
            >
              Secretariat
            </h2>
            <p className="section-lead text-parchment/75">
              {members.length
                ? "The Executive Board behind Edition I."
                : "The Executive Board behind Edition I — profiles publish as photography is confirmed."}
            </p>
          </div>
          <Link href="/secretariat" className="btn-ghost-light self-start">
            Full secretariat →
          </Link>
        </div>

        {members.length > 0 ? (
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-10">
            {members.map((member) => (
              <SecretariatPortrait key={member.id} member={member} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
