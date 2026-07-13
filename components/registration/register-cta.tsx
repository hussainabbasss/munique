"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type RegisterCtaProps = {
  enabled: boolean;
  message: string;
  className?: string;
  children: React.ReactNode;
  /** Called when navigating (enabled) — e.g. to close a menu dialog. */
  onNavigate?: () => void;
};

/**
 * Registration call-to-action. When registration is enabled it links to the
 * register portal; when the admin has disabled it, the button stays visible
 * but flashes a "not live" note instead of navigating.
 */
export function RegisterCta({
  enabled,
  message,
  className,
  children,
  onNavigate,
}: RegisterCtaProps) {
  const [noticeOpen, setNoticeOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  if (enabled) {
    return (
      <Link href="/register" className={className} onClick={onNavigate}>
        {children}
      </Link>
    );
  }

  const flashNotice = () => {
    setNoticeOpen(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setNoticeOpen(false), 3200);
  };

  return (
    <span className="register-cta-wrap">
      <button
        type="button"
        className={`${className ?? ""} register-cta-off`.trim()}
        aria-disabled="true"
        onClick={flashNotice}
      >
        {children}
      </button>
      <span
        className={`register-cta-note${noticeOpen ? " is-open" : ""}`}
        role="status"
        aria-live="polite"
      >
        {noticeOpen ? message : ""}
      </span>
    </span>
  );
}
