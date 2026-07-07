import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main id="main" className="mx-auto max-w-[65ch] px-6 py-16">
      <h1 className="font-display text-[clamp(1.75rem,3vw,2.625rem)] font-semibold text-ink-navy text-balance">
        Privacy
      </h1>
      <p className="mt-4 text-base leading-relaxed text-ink-navy-soft text-pretty">
        Privacy policy stub — full policy will be published before registration
        data collection begins.
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
