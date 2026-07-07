import Image from "next/image";
import Link from "next/link";
import { images } from "@/lib/images";

export function ExploreGrid() {
  return (
    <section
      id="explore"
      className="explore-section"
      aria-labelledby="explore-title"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-10 flex flex-col gap-5 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="explore-title" className="section-title text-ink-navy">
              The conference dossier
            </h2>
            <p className="section-lead">
              Everything a delegate needs before stepping into committee —
              indexed like documents on a chancellery desk.
            </p>
          </div>
          <Link href="/register" className="btn-primary self-start lg:self-auto">
            Register now
          </Link>
        </div>

        <div className="explore-mosaic">
          <Link href="/about" className="explore-tile explore-tile-about group">
            <Image
              src={images.chamberDesk}
              alt="Leather-bound documents and a fountain pen on a desk"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="explore-tile-image"
            />
            <div className="explore-tile-overlay" />
            <div className="explore-tile-body">
              <p className="explore-tile-kicker">Institution</p>
              <h3 className="explore-tile-title">About Munique</h3>
              <p className="explore-tile-copy">
                Edition I marks the first chapter of a conference built for
                seriousness, originality, and the weight diplomacy deserves.
              </p>
              <span className="explore-tile-link">Read the brief →</span>
            </div>
          </Link>

          <Link
            href="/committees"
            className="explore-tile explore-tile-committees group"
          >
            <Image
              src={images.committeesGavel}
              alt="Wooden gavel beside a law book on a dark surface"
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="explore-tile-image"
            />
            <div className="explore-tile-overlay explore-tile-overlay-deep" />
            <div className="explore-tile-body">
              <p className="explore-tile-kicker">8 chambers</p>
              <h3 className="explore-tile-title">Committees</h3>
              <p className="explore-tile-copy">
                Security Council · UNHRC · ECOSOC · DISEC — plus four additional
                committees awaiting publication.
              </p>
              <span className="explore-tile-link">View committees →</span>
            </div>
          </Link>

          <Link
            href="/schedule"
            className="explore-tile explore-tile-schedule group"
          >
            <div className="explore-tile-body explore-tile-body-flat">
              <p className="explore-tile-kicker">Programme</p>
              <h3 className="explore-tile-title">Schedule &amp; Venue</h3>
              <p className="font-mono text-sm text-ink-navy">[Dates TBD]</p>
              <p className="explore-tile-copy">
                Full programme and venue details publish before registration
                closes.
              </p>
              <span className="explore-tile-link">View schedule →</span>
            </div>
          </Link>

          <Link
            href="/study-guide"
            className="explore-tile explore-tile-study group"
          >
            <div className="explore-tile-body explore-tile-body-flat">
              <p className="explore-tile-kicker">Resources</p>
              <h3 className="explore-tile-title">Study Guide</h3>
              <p className="explore-tile-copy">
                Committee study guides publish before sessions begin.
              </p>
              <span className="explore-tile-link">Coming soon</span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
