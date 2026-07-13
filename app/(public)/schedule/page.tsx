import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { SealLine } from "@/components/seal-line";
import { getScheduleStatus } from "@/lib/admin/helpers";
import "../program.css";

const DAYS = [
  {
    day: "Day 1",
    session: "Opening",
    items: [
      "Registration desk and check-in",
      "Opening ceremony and keynote address",
      "First committee sessions",
    ],
    note: "Time blocks publish after final venue lock.",
  },
  {
    day: "Day 2",
    session: "Negotiation",
    items: [
      "Moderated and unmoderated caucuses",
      "Working paper circulation",
      "Draft resolution submissions",
    ],
    note: "Committee-specific sequencing appears on final release.",
  },
  {
    day: "Day 3",
    session: "Closing",
    items: [
      "Final voting sessions",
      "Award and recognition ceremony",
      "Closing remarks",
    ],
    note: "Departure guidance and logistics are shared with schools.",
  },
];

function HallArcs() {
  return (
    <svg
      className="hall-arcs"
      viewBox="0 0 1440 480"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="720" cy="640" r="240" opacity="0.35" />
        <circle cx="720" cy="640" r="360" opacity="0.28" />
        <circle cx="720" cy="640" r="480" opacity="0.22" />
        <circle cx="720" cy="640" r="600" opacity="0.16" />
      </g>
    </svg>
  );
}

function ScheduleComingSoon() {
  return (
    <main id="main">
      <header className="hall">
        <HallArcs />
        <div className="hall-inner">
          <div className="hall-meta">
            <span>Munique ’26 · Edition I</span>
            <span>Programme</span>
            <span>Coming soon</span>
          </div>
          <h1 className="hall-title">Coming soon</h1>
          <p className="hall-lede">
            The order of proceedings is still being finalised by the Executive
            Board. It publishes here once venue and dates lock — check back
            shortly.
          </p>
        </div>
      </header>

      <div className="sheet prog-foot">
        <Link href="/" className="arrow-cta prog-back">
          <span className="arrow" aria-hidden>
            ←
          </span>
          Back to the floor
        </Link>
      </div>
    </main>
  );
}

export default async function SchedulePage() {
  const schedule = await getScheduleStatus();

  if (!schedule.enabled) {
    return <ScheduleComingSoon />;
  }

  return (
    <main id="main">
      <header className="hall">
        <HallArcs />
        <div className="hall-inner">
          <div className="hall-meta">
            <span>Munique ’26 · Edition I</span>
            <span>Three sittings</span>
            <span>Dates TBD</span>
          </div>
          <h1 className="hall-title">Order of proceedings</h1>
          <p className="hall-lede">
            The complete programme is posted by the Executive Board after venue
            lock. The order below stands; the clock follows.
          </p>
        </div>
      </header>

      <section className="sheet prog-section" aria-label="Programme structure">
        <div className="prog-days">
          {DAYS.map((d, i) => (
            <article key={d.day} className="prog-day">
              <Reveal delay={Math.min(i, 4) * 70}>
                <h2 className="display prog-day-title">
                  <span className="prog-day-n">{d.day}</span>
                  <span className="prog-day-s">{d.session}</span>
                </h2>
                <ol className="prog-times">
                  {d.items.map((item) => (
                    <li key={item} className="prog-time-row">
                      <span className="prog-time">TBD</span>
                      <span className="prog-event">{item}</span>
                    </li>
                  ))}
                </ol>
                <p className="prog-day-note">{d.note}</p>
              </Reveal>
            </article>
          ))}
        </div>
      </section>

      <section className="sheet prog-venue-wrap" aria-label="Venue status">
        <Reveal>
          <div className="prog-ink">
            <div className="prog-ink-meta">
              <span>Venue status</span>
              <span className="prog-ink-tags">
                <span className="tag tag-dark">Venue TBA</span>
                <span className="tag tag-dark">Dates TBA</span>
              </span>
            </div>
            <h2 className="display prog-ink-line">Venue to be announced</h2>
            <p className="prog-ink-copy">
              Venue and dates are under final confirmation. On lock, this page
              publishes exact reporting times, hall allocation and
              committee-room mapping.
            </p>
            <SealLine aria-hidden className="prog-ink-seal" />
          </div>
        </Reveal>
      </section>

      <div className="sheet prog-foot">
        <Link href="/" className="arrow-cta prog-back">
          <span className="arrow" aria-hidden>
            ←
          </span>
          Back to the floor
        </Link>
      </div>
    </main>
  );
}
