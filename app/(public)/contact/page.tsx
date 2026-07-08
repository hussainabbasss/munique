import type { Metadata } from "next";
import Link from "next/link";
import { ContactQueryForm } from "@/components/contact-query-form";
import "../story.css";

export const metadata: Metadata = {
  title: "Contact — Munique 2026",
  description:
    "Lodge a delegate query with the Munique 2026 Executive Board.",
};

export default function ContactPage() {
  return (
    <main id="main">
      <section className="story-contact">
        {/* ── Left: cobalt brief ── */}
        <div className="story-contact-brief">
          <div className="story-contact-brief-inner">
            <div className="story-contact-meta">
              <span>Contact</span>
              <span>Edition I · 2026</span>
            </div>
            <h1 className="display display-lg story-contact-title">
              Lodge a query
            </h1>
            <p className="story-contact-guide">
              Logged on receipt · Answered by the Executive Board
            </p>
            <p className="story-contact-note">
              Submit a delegate query with the form. The Executive Board
              responds to tickets in the admin panel — no WhatsApp threads.
            </p>

            <h2 className="mono-label mono-label-dark story-channels-label">
              Channels
            </h2>
            <ul className="ledger story-channels">
              <li className="ledger-row">
                <a
                  href="https://instagram.com/munique_2026"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ledger-link"
                >
                  <span className="story-channel-key">
                    Instagram · General updates
                  </span>
                  <span className="story-channel-val">@munique_2026 ↗</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Right: the query form as a procedural document ── */}
        <div className="story-contact-desk">
          <div className="story-contact-desk-inner">
            <div className="story-desk-head">
              <p className="mono-label">Query form</p>
              <p className="mono-label">Fields · 05</p>
            </div>

            <ContactQueryForm />

            <Link href="/" className="link-wipe story-back">
              ← Back to homepage
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
