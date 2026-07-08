import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { SealLine } from "@/components/seal-line";
import "../story.css";

export const metadata: Metadata = {
  title: "About — Munique 2026",
  description:
    "What Munique is: Edition I of a conference built for delegates who treat diplomacy as craft.",
};

export default function AboutPage() {
  return (
    <main id="main">
      {/* ── Hall band ── */}
      <section className="hall">
        <div className="hall-inner">
          <div className="hall-meta">
            <span>About</span>
            <span>Edition I · 2026</span>
            <span>Capacity 250–300 delegates</span>
          </div>
          <h1 className="hall-title">What Munique is</h1>
          <p className="hall-lede">
            A Model United Nations conference entering the record as Edition I.
            The full institutional history and mission will be published on
            this page as it is set down.
          </p>
        </div>
      </section>

      {/* ── Monumental statement — paper ── */}
      <section className="story-band">
        <div className="sheet">
          <Reveal>
            <h2 className="display display-lg story-statement-title">
              Diplomacy, treated as craft.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="prose-lede story-statement-lede">
              Edition I introduces Munique as a conference built for delegates
              who treat diplomacy as craft — who prepare the brief, hold the
              floor, and argue from the record rather than the microphone.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Credo — ink, seal faint behind ── */}
      <section className="story-band story-band-ink story-credo">
        <SealLine className="story-credo-seal" aria-hidden="true" />
        <div className="sheet story-credo-inner">
          <Reveal>
            <p className="mono-label mono-label-dark story-credo-label">
              The credo
            </p>
            <h2 className="display display-md story-credo-title">
              The uniqueness of diplomacy
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="story-credo-copy">
              Not the loudest voice — the most exact one. Munique convenes
              delegates who read the clause before they raise the placard, and
              keeps every proceeding on the record.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Edition I specifics — cobalt ── */}
      <section className="story-band story-band-cobalt">
        <div className="sheet story-edition">
          <Reveal>
            <h2 className="display display-md story-edition-title">
              Edition I
            </h2>
            <div className="story-tag-row">
              <span className="tag tag-dark">Dates · TBD</span>
              <span className="tag tag-dark">Venue · TBD</span>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <dl className="story-spec">
              <div className="story-spec-row">
                <dt className="story-spec-key">Format</dt>
                <dd className="story-spec-val">Model United Nations</dd>
              </div>
              <div className="story-spec-row">
                <dt className="story-spec-key">Year</dt>
                <dd className="story-spec-val">2026</dd>
              </div>
              <div className="story-spec-row">
                <dt className="story-spec-key">Capacity</dt>
                <dd className="story-spec-val">250–300 delegates</dd>
              </div>
              <div className="story-spec-row">
                <dt className="story-spec-key">Signal</dt>
                <dd className="story-spec-val">
                  <a
                    href="https://instagram.com/munique_2026"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-wipe"
                  >
                    @munique_2026
                  </a>
                </dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ── Closing register band — paper ── */}
      <section className="story-band">
        <div className="sheet story-close-inner">
          <Reveal>
            <h2 className="display display-lg story-close-title">
              Take your seat.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <div className="story-close-actions">
              <Link href="/register" className="btn btn-ink">
                Register for Edition I
              </Link>
              <Link href="/contact" className="arrow-cta">
                Lodge a query <span className="arrow">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
