import Image from "next/image";
import Link from "next/link";
import { PartnerSeal } from "@/components/partner-seal";

const attendLinks = [
  { href: "/register", label: "Register" },
  { href: "/committees", label: "Committees" },
  { href: "/schedule", label: "Schedule" },
  { href: "/study-guide", label: "Study Guides" },
] as const;

const conferenceLinks = [
  { href: "/about", label: "About" },
  { href: "/eb", label: "Executive Board" },
  { href: "/secretariat", label: "Secretariat" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand-row">
          <Image
            src="/logo.png"
            alt="Munique 2026 official emblem"
            width={80}
            height={80}
            className="footer-emblem emblem-on-dark"
          />
          <p className="footer-mark">
            Munique <span className="tick">’26</span>
          </p>
        </div>

        <div className="footer-grid">
          <div>
            <p className="footer-col-label">The assembly convenes</p>
            <p className="footer-note">
              Edition I of Munique — the Uniqueness of Diplomacy. Built for
              delegates who treat negotiation as craft, not performance.
            </p>
            <p className="footer-note" style={{ marginTop: "1rem" }}>
              Need a website for your conference?{" "}
              <a
                href="https://systemsummit.online"
                target="_blank"
                rel="noopener noreferrer"
                className="site-footer-link"
              >
                Contact now
              </a>
            </p>
          </div>

          <nav aria-label="Attend">
            <p className="footer-col-label">Attend</p>
            <ul className="footer-links">
              {attendLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="site-footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Conference">
            <p className="footer-col-label">Conference</p>
            <ul className="footer-links">
              {conferenceLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="site-footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://instagram.com/munique_2026"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-footer-link"
                >
                  @munique_2026
                </a>
              </li>
              <li>
                <Link href="/privacy" className="site-footer-link">
                  Privacy
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="footer-legal">
          <PartnerSeal />
          <p style={{ margin: 0 }}>© Munique 2026 · Edition I</p>
        </div>
      </div>
    </footer>
  );
}
