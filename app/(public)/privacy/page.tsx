import type { Metadata } from "next";
import Link from "next/link";
import "../story.css";

export const metadata: Metadata = {
  title: "Privacy — Munique 2026",
  description: "Privacy policy for the Munique 2026 conference.",
};

export default function PrivacyPage() {
  return (
    <main id="main">
      {/* ── Compact hall band ── */}
      <section className="hall story-hall-compact">
        <div className="hall-inner">
          <div className="hall-meta">
            <span>Munique 2026</span>
            <span>Procedural record</span>
          </div>
          <h1 className="hall-title">Privacy</h1>
        </div>
      </section>

      {/* ── Typeset document ── */}
      <div className="sheet">
        <div className="story-doc">
          <p className="mono-label story-doc-updated">Last updated · TBD</p>

          <h2 className="story-doc-h2">Status of this policy</h2>
          <p className="prose-body">
            Privacy policy stub — full policy will be published before
            registration data collection begins.
          </p>

          <Link href="/" className="link-wipe story-back">
            ← Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
