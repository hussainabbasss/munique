import Link from "next/link";
import { SealLine } from "@/components/seal-line";
import { RegisterCta } from "@/components/registration/register-cta";
import { getRegistrationStatus } from "@/lib/admin/helpers";

/* ── General-assembly seating chart ──
   Concentric arc rows of seat marks radiating from bottom center.
   Computed once at module scope — deterministic, server-rendered. */

const CHART_CX = 720;
const CHART_CY = 710;
const CHART_ROWS = [180, 240, 300, 360, 420, 480, 540, 600] as const;
const ARC_START = Math.PI * 1.06;
const ARC_END = Math.PI * 1.94;
const SEAT_SPACING = 34;
const SEAT_DEPTH = 11;

type SeatMark = { x1: string; y1: string; x2: string; y2: string };

function buildSeatMarks(): SeatMark[] {
  const marks: SeatMark[] = [];
  for (const radius of CHART_ROWS) {
    const count = Math.max(
      10,
      Math.round((radius * (ARC_END - ARC_START)) / SEAT_SPACING),
    );
    for (let i = 0; i <= count; i += 1) {
      const angle = ARC_START + ((ARC_END - ARC_START) * i) / count;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      marks.push({
        x1: (CHART_CX + cos * radius).toFixed(1),
        y1: (CHART_CY + sin * radius).toFixed(1),
        x2: (CHART_CX + cos * (radius + SEAT_DEPTH)).toFixed(1),
        y2: (CHART_CY + sin * (radius + SEAT_DEPTH)).toFixed(1),
      });
    }
  }
  return marks;
}

const seatMarks = buildSeatMarks();

export async function Hero() {
  const registration = await getRegistrationStatus();

  return (
    <section className="home-hero" aria-labelledby="hero-title">
      <div className="home-hero-backdrop" aria-hidden>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 620"
          preserveAspectRatio="xMidYMax slice"
          className="home-hero-chart"
        >
          {CHART_ROWS.map((radius) => (
            <circle
              key={radius}
              cx={CHART_CX}
              cy={CHART_CY}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.4"
            />
          ))}
          {seatMarks.map((mark, index) => (
            <line
              key={index}
              x1={mark.x1}
              y1={mark.y1}
              x2={mark.x2}
              y2={mark.y2}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
            />
          ))}
        </svg>

        <div className="home-hero-seal">
          <SealLine className="home-hero-seal-svg" aria-hidden />
        </div>
      </div>

      <div className="home-hero-inner">
        <p className="home-hero-meta home-rise">
          Model United Nations — Edition I — 2026
        </p>

        <div className="home-hero-block">
          <h1 id="hero-title" className="display home-hero-title home-rise home-rise-d1">
            Munique
          </h1>

          <p className="home-hero-tagline home-rise home-rise-d2">
            The Uniqueness of Diplomacy
          </p>

          <p className="home-hero-lede home-rise home-rise-d2">
            A first-edition assembly of 250–300 delegates. Full procedure,
            serious chairing — debate treated as craft, not performance.
          </p>

          <div className="home-hero-actions home-rise home-rise-d3">
            <RegisterCta
              enabled={registration.enabled}
              message={registration.message}
              className="btn btn-signal"
            >
              Register
            </RegisterCta>
            <Link href="/committees" className="arrow-cta home-hero-cta-alt">
              View committees{" "}
              <span className="arrow" aria-hidden>
                →
              </span>
            </Link>
          </div>
        </div>

        <dl className="home-hero-strip home-rise home-rise-d4">
          <div className="home-hero-strip-cell">
            <dt>Edition</dt>
            <dd>I</dd>
          </div>
          <div className="home-hero-strip-cell">
            <dt>Capacity</dt>
            <dd>250–300</dd>
          </div>
          <div className="home-hero-strip-cell">
            <dt>Dates</dt>
            <dd>TBA</dd>
          </div>
        </dl>
      </div>

      <div className="hero-scroll-sentinel" aria-hidden />
    </section>
  );
}
