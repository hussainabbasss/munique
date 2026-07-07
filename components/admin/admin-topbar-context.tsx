"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Overview",
  "/admin/registrations": "Registrations",
  "/admin/allotments": "Allotments",
  "/admin/queries": "Queries",
  "/admin/pricing": "Pricing",
  "/admin/committees": "Committees",
  "/admin/sponsors": "Sponsors",
  "/admin/team": "Team",
};

export function AdminTopbarContext() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Admin";

  return (
    <div className="admin-topbar-context">
      <span className="admin-topbar-eyebrow">Executive Board</span>
      <span className="admin-topbar-sep" aria-hidden>
        /
      </span>
      <span className="admin-topbar-page">{title}</span>
    </div>
  );
}
