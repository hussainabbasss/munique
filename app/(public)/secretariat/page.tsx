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

function SecretariatProfile({ member }: { member: SecretariatMember }) {
  const portraitUrl = member.portrait_path
    ? getPublicStorageUrl("secretariat-portraits", member.portrait_path)
    : null;

  return (
    <article className="secretariat-page-card">
      <div className="secretariat-page-ring">
        {portraitUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portraitUrl}
            alt=""
            className="secretariat-page-avatar secretariat-page-avatar-photo"
            width={160}
            height={160}
          />
        ) : (
          <div className="secretariat-page-avatar" aria-hidden>
            {initialsFromName(member.full_name)}
          </div>
        )}
      </div>
      <h2 className="mt-5 font-display text-xl font-semibold text-ink-navy">
        {member.full_name}
      </h2>
      {member.role_title && (
        <p className="mt-1 text-sm text-ink-navy-soft">{member.role_title}</p>
      )}
    </article>
  );
}

export default async function SecretariatPage() {
  const members = await fetchPublishedSecretariat();

  return (
    <main id="main" className="mx-auto max-w-[1280px] px-6 py-16">
      <h1 className="font-display text-[clamp(1.75rem,3vw,2.625rem)] font-semibold text-ink-navy text-balance">
        Secretariat
      </h1>
      <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-ink-navy-soft text-pretty">
        {members.length
          ? "The Executive Board leading Munique Edition I."
          : "Executive Board profiles will appear here once published from the admin panel."}
      </p>

      {members.length > 0 && (
        <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <SecretariatProfile key={member.id} member={member} />
          ))}
        </div>
      )}

      <Link
        href="/"
        className="mt-12 inline-block text-sm font-semibold text-ink-navy no-underline hover:underline"
      >
        ← Back to homepage
      </Link>
    </main>
  );
}
