import Link from "next/link";
import {
  fetchPublishedCommittees,
  getPublicStorageUrl,
} from "@/lib/public/queries";

export default async function CommitteesPage() {
  const committees = await fetchPublishedCommittees();

  return (
    <main id="main" className="mx-auto max-w-[720px] px-6 py-16">
      <h1 className="font-display text-[clamp(1.75rem,3vw,2.625rem)] font-semibold text-ink-navy text-balance">
        Committees
      </h1>
      <p className="mt-4 text-base leading-relaxed text-ink-navy-soft text-pretty">
        Agendas and study guides for Munique 2026 Edition I.
      </p>

      {committees.length === 0 ? (
        <p className="mt-8 text-sm text-ink-navy-soft">
          Committee details will be published here before registration closes.
        </p>
      ) : (
        <ul className="mt-10 space-y-8">
          {committees.map((c) => {
            const guideUrl = c.study_guide_path
              ? getPublicStorageUrl("study-guides", c.study_guide_path)
              : null;

            return (
              <li
                key={c.id}
                className="rounded-sm border border-[rgba(46,64,102,0.18)] bg-paper-white p-6"
              >
                <h2 className="font-display text-xl font-semibold text-ink-navy">
                  {c.name}
                </h2>
                {c.short_description && (
                  <p className="mt-2 text-sm text-ink-navy-soft">
                    {c.short_description}
                  </p>
                )}
                {c.agenda && (
                  <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-navy">
                    {c.agenda}
                  </div>
                )}
                {guideUrl && (
                  <a
                    href={guideUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-sm font-semibold text-ink-navy underline-offset-2 hover:underline"
                  >
                    Download study guide
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/"
        className="mt-10 inline-block text-sm font-semibold text-ink-navy no-underline hover:underline"
      >
        ← Back to homepage
      </Link>
    </main>
  );
}
