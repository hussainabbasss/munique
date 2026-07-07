import Link from "next/link";

export default function SchedulePage() {
  return (
    <main id="main" className="mx-auto max-w-[65ch] px-6 py-16">
      <h1 className="font-display text-[clamp(1.75rem,3vw,2.625rem)] font-semibold text-ink-navy text-balance">
        Schedule & Venue
      </h1>
      <p className="mt-4 font-mono text-sm text-ink-navy">[Dates TBD]</p>
      <p className="mt-2 text-base leading-relaxed text-ink-navy-soft text-pretty">
        Conference programme and venue details are pending Executive Board
        confirmation.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-semibold text-ink-navy no-underline hover:underline"
      >
        ← Back to homepage
      </Link>
    </main>
  );
}
