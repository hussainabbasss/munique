import Link from "next/link";

function StubPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main id="main" className="mx-auto max-w-[65ch] px-6 py-16">
      <h1 className="font-display text-[clamp(1.75rem,3vw,2.625rem)] font-semibold text-ink-navy text-balance">
        {title}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-ink-navy-soft text-pretty">
        {description}
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

export default function AboutPage() {
  return (
    <StubPage
      title="About Munique"
      description="Full institutional history and conference mission will be published here. Edition I introduces Munique as a conference built for delegates who treat diplomacy as craft."
    />
  );
}
