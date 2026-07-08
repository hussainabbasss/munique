"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/eb", label: "Executive Board" },
  { href: "/committees", label: "Committees" },
  { href: "/schedule", label: "Schedule" },
  { href: "/contact", label: "Contact" },
] as const;

const menuLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/eb", label: "Executive Board" },
  { href: "/secretariat", label: "Secretariat" },
  { href: "/committees", label: "Committees" },
  { href: "/schedule", label: "Schedule" },
  { href: "/study-guide", label: "Study Guides" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(isHome);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (menuOpen && !dialog.open) {
      dialog.showModal();
    } else if (!menuOpen && dialog.open) {
      dialog.close();
    }
  }, [menuOpen]);

  useEffect(() => {
    if (!isHome) return;

    const sentinel = document.querySelector(".hero-scroll-sentinel");
    if (!sentinel) {
      const frame = requestAnimationFrame(() => setHeroVisible(false));
      return () => cancelAnimationFrame(frame);
    }

    // Overlay while the hero's end marker is still below the nav band —
    // intersecting (crossing the viewport) or parked below the fold both count.
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.boundingClientRect.top > 96),
      { threshold: [0, 1] },
    );

    observer.observe(sentinel);

    const onScroll = () => {
      const top = sentinel.getBoundingClientRect().top;
      setHeroVisible(top > 96);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [isHome]);

  const overlayNav = isHome && heroVisible;

  return (
    <header
      className={`site-nav ${overlayNav ? "site-nav-overlay" : "site-nav-solid"}`}
    >
      <nav className="site-nav-inner" aria-label="Main navigation">
        <Link href="/" className="site-nav-brand">
          <Image
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            priority
            className="brand-emblem site-nav-emblem"
          />
          <span className="site-nav-wordmark">Munique</span>
          <span className="site-nav-year">’26</span>
        </Link>

        <div className="site-nav-links">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="site-nav-link"
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/register" className="btn btn-signal site-nav-cta">
            Register
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Link href="/register" className="btn btn-signal site-nav-cta">
            Register
          </Link>
          <button
            type="button"
            className="site-nav-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="site-menu-dialog"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <span className="bar" aria-hidden />
            <span className="bar" aria-hidden />
          </button>
        </div>
      </nav>

      <dialog
        ref={dialogRef}
        id="site-menu-dialog"
        className="menu-dialog"
        onClose={() => setMenuOpen(false)}
      >
        <div className="menu-head">
          <span className="site-nav-brand" style={{ color: "inherit" }}>
            <Image
              src="/logo.png"
              alt=""
              width={32}
              height={32}
              className="brand-emblem menu-head-emblem emblem-on-dark"
            />
            <span className="site-nav-wordmark">Munique</span>
          </span>
          <button
            type="button"
            className="menu-close"
            onClick={() => setMenuOpen(false)}
          >
            Close ✕
          </button>
        </div>

        <ul className="menu-list">
          {menuLinks.map((link, index) => (
            <li
              key={link.href}
              className="menu-item"
              style={{ "--menu-i": index } as CSSProperties}
            >
              <Link
                href={link.href}
                className="menu-link"
                aria-current={pathname === link.href ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
                <span className="menu-index" aria-hidden>
                  {link.href === "/" ? "•" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="menu-foot">
          <Link
            href="/register"
            className="btn btn-signal"
            onClick={() => setMenuOpen(false)}
          >
            Register for Edition I
          </Link>
          <a
            href="https://instagram.com/munique_2026"
            target="_blank"
            rel="noopener noreferrer"
            className="mono-label mono-label-dark link-wipe"
          >
            @munique_2026
          </a>
        </div>
      </dialog>
    </header>
  );
}
