"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SealImage } from "@/components/seal-image";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/committees", label: "Committees" },
  { href: "/schedule", label: "Schedule" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);

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
    if (!isHome) {
      setPastHero(true);
      return;
    }

    const sentinel = document.querySelector(".hero-scroll-sentinel");
    if (!sentinel) {
      setPastHero(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-68px 0px 0px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isHome]);

  const overlayNav = isHome && !pastHero;

  return (
    <header
      className={`site-nav ${overlayNav ? "site-nav-overlay" : "site-nav-solid"}`}
    >
      <nav
        className="mx-auto flex h-[4.25rem] max-w-[1280px] items-center justify-between px-5 lg:h-[4.75rem] lg:px-10"
        aria-label="Main navigation"
      >
        <Link href="/" className="site-nav-brand">
          <SealImage
            alt=""
            width={32}
            height={32}
            decorative
            className={`site-nav-seal ${overlayNav ? "site-nav-seal-overlay" : ""}`}
          />
          <span className="site-nav-wordmark">Munique</span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="site-nav-link">
              {link.label}
            </Link>
          ))}
          <Link
            href="/register"
            className={`btn-primary btn-primary-nav ${overlayNav ? "btn-primary-nav-overlay" : ""}`}
          >
            Register
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/register"
            className={`btn-primary btn-primary-nav ${overlayNav ? "btn-primary-nav-overlay" : ""}`}
          >
            Register
          </Link>
          <button
            type="button"
            className="site-nav-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-dialog"
            onClick={() => setMenuOpen(true)}
          >
            Menu
          </button>
        </div>
      </nav>

      <dialog
        ref={dialogRef}
        id="mobile-nav-dialog"
        className="site-nav-dialog"
        onClose={() => setMenuOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            setMenuOpen(false);
          }
        }}
      >
        <div className="flex items-center justify-between border-b border-ink-navy-soft/30 px-6 py-4">
          <span className="font-display text-lg font-semibold tracking-wide">
            Navigate
          </span>
          <button
            type="button"
            className="min-h-11 min-w-11 text-sm font-medium text-ink-navy-soft"
            onClick={() => setMenuOpen(false)}
          >
            Close
          </button>
        </div>
        <ul className="m-0 list-none p-0">
          {navLinks.map((link) => (
            <li key={link.href} className="border-b border-ink-navy-soft/20">
              <Link
                href={link.href}
                className="block px-6 py-4 text-base font-medium text-ink-navy no-underline"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </dialog>
    </header>
  );
}
