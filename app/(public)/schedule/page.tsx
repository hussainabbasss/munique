import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { SealLine } from "@/components/seal-line";
import { getScheduleStatus } from "@/lib/admin/helpers";
import "../program.css";

const DAYS = [
  {
    day: "Day 1",
    date: "17 October",
    session: "Opening",
    items: [
      "Registration desk and check-in",
      "Opening ceremony and keynote address",
      "First committee sessions",
    ],
    note: "Exact time blocks are confirmed by the Executive Board before session.",
  },
  {
    day: "Day 2",
    date: "18 October",
    session: "Negotiation & closing",
    items: [
      "Moderated and unmoderated caucuses",
      "Working paper circulation and draft resolutions",
      "Final voting, awards, and closing remarks",
    ],
    note: "Committee-specific sequencing appears on final release.",
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
            <span>17–18 October 2026</span>
            <span>AMHSS, Karachi</span>
          </div>
          <h1 className="hall-title">Coming soon</h1>
          <p className="hall-lede">
            The order of proceedings is still being finalised by the Executive
            Board. Edition I sits 17–18 October 2026 at Al Murtaza Higher
            Secondary School (AMHSS), Karachi — the detailed clock publishes
            here shortly.
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
            <span>Two sittings</span>
            <span>17–18 October 2026</span>
          </div>
          <h1 className="hall-title">Order of proceedings</h1>
          <p className="hall-lede">
            Edition I convenes over two days at Al Murtaza Higher Secondary
            School (AMHSS), Karachi. The order below stands; exact reporting
            times follow from the Executive Board.
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
                  <span className="prog-day-s">
                    {d.date} · {d.session}
                  </span>
                </h2>
                <ol className="prog-times">
                  {d.items.map((item) => (
                    <li key={item} className="prog-time-row">
                      <span className="prog-time">{d.date}</span>
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

      <section className="sheet prog-venue-wrap" aria-label="Venue">
        <Reveal>
          <div className="prog-ink">
            <div className="prog-ink-meta">
              <span>Venue</span>
              <span className="prog-ink-tags">
                <span className="tag tag-dark">AMHSS, Karachi</span>
                <span className="tag tag-dark">17–18 October 2026</span>
              </span>
            </div>
            <h2 className="display prog-ink-line">
              Al Murtaza Higher Secondary School
            </h2>
            <p className="prog-ink-copy">
              AMHSS, Karachi hosts Edition I. Exact reporting times, hall
              allocation, and committee-room mapping are published by the
              Executive Board before session.
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
