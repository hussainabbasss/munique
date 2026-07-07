"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminRole } from "@/lib/types/admin";

const NAV: {
  href: string;
  label: string;
  exact?: boolean;
  section: "operations" | "conference" | "access";
  roles?: AdminRole[];
}[] = [
  { href: "/admin", label: "Overview", exact: true, section: "operations", roles: ["admin", "reviewer"] },
  { href: "/admin/registrations", label: "Registrations", section: "operations" },
  { href: "/admin/allotments", label: "Allotments", section: "operations", roles: ["admin", "reviewer"] },
  { href: "/admin/queries", label: "Queries", section: "operations", roles: ["admin", "reviewer"] },
  { href: "/admin/pricing", label: "Pricing", section: "conference", roles: ["admin", "reviewer"] },
  { href: "/admin/committees", label: "Committees", section: "conference", roles: ["admin", "reviewer"] },
  { href: "/admin/sponsors", label: "Sponsors", section: "conference", roles: ["admin", "reviewer"] },
  { href: "/admin/secretariat", label: "Secretariat", section: "conference", roles: ["admin", "reviewer"] },
  { href: "/admin/team", label: "Team", section: "access", roles: ["admin"] },
];

function navForRole(role: AdminRole) {
  return NAV.filter(
    (item) => !item.roles || item.roles.includes(role),
  );
}

type Props = {
  role: AdminRole;
  onNavigate?: () => void;
};

export function AdminNav({ role, onNavigate }: Props) {
  const pathname = usePathname();
  const items = navForRole(role);
  const operations = items.filter((item) => item.section === "operations");
  const conference = items.filter((item) => item.section === "conference");
  const access = items.filter((item) => item.section === "access");

  return (
    <nav className="admin-nav" aria-label="Admin sections">
      {operations.length > 0 && (
        <>
          <p className="admin-nav-heading">Operations</p>
          <ul className="admin-nav-list">
            {operations.map((item) => (
              <AdminNavItem
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </>
      )}

      {conference.length > 0 && (
        <>
          <p className="admin-nav-heading">Conference</p>
          <ul className="admin-nav-list">
            {conference.map((item) => (
              <AdminNavItem
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </>
      )}

      {access.length > 0 && (
        <>
          <p className="admin-nav-heading">Access</p>
          <ul className="admin-nav-list">
            {access.map((item) => (
              <AdminNavItem
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </>
      )}
    </nav>
  );
}

function AdminNavItem({
  item,
  pathname,
  onNavigate,
}: {
  item: (typeof NAV)[number];
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);

  return (
    <li>
      <Link
        href={item.href}
        className={`admin-nav-link${active ? " admin-nav-link-active" : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={onNavigate}
      >
        {item.label}
      </Link>
    </li>
  );
}
