import Link from "next/link";
import { PartnerSeal } from "@/components/partner-seal";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap gap-x-6 gap-y-3"
        >
          <Link href="/contact" className="site-footer-link">
            Contact
          </Link>
          <a
            href="https://instagram.com/munique_2026"
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer-link"
          >
            Follow @munique_2026
          </a>
          <Link href="/privacy" className="site-footer-link">
            Privacy
          </Link>
        </nav>

        <div className="mt-8">
          <PartnerSeal />
        </div>

        <p className="site-footer-pitch">
          Need a website for your conference?{" "}
          <span className="site-footer-pitch-cta">Contact now</span>
        </p>

        <p className="site-footer-copy">© Munique 2026 · Edition I</p>
      </div>
    </footer>
  );
}
