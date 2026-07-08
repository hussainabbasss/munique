"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminThemeToggle } from "@/components/admin/admin-theme-toggle";
import { AdminTopbarContext } from "@/components/admin/admin-topbar-context";
import { SealImage } from "@/components/seal-image";
import { signOutAction } from "@/lib/admin/actions/auth";

import type { AdminRole } from "@/lib/types/admin";

type Props = {
  adminEmail: string | null;
  adminRole: AdminRole;
  children: React.ReactNode;
};

export function AdminShell({ adminEmail, adminRole, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    if (!sidebarOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeSidebar();
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [sidebarOpen, closeSidebar]);

  return (
    <div className="admin-app">
      {sidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      <aside
        id="admin-sidebar"
        className={`admin-sidebar${sidebarOpen ? " admin-sidebar-open" : ""}`}
        aria-label="Admin navigation"
      >
        <div className="admin-sidebar-brand">
          <SealImage
            alt=""
            width={32}
            height={32}
            decorative
            className="admin-sidebar-seal"
          />
          <div>
            <p className="admin-sidebar-title">Munique</p>
            <p className="admin-sidebar-subtitle">
              {adminRole === "registration_staff"
                ? "Registration staff"
                : "Executive Board"}
            </p>
          </div>
        </div>

        <AdminNav role={adminRole} onNavigate={closeSidebar} />

        <div className="admin-sidebar-footer">
          {adminEmail && (
            <p className="admin-sidebar-user" title={adminEmail}>
              {adminEmail}
            </p>
          )}
          <form action={signOutAction}>
            <button type="submit" className="admin-sidebar-signout">
              Sign out
            </button>
          </form>
          <div className="admin-sidebar-partner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/system-summit.png"
              alt="System Summit"
              className="admin-sidebar-partner-logo"
            />
          </div>
        </div>
      </aside>

      <div className="admin-frame">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-btn"
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <span className="admin-menu-icon" aria-hidden />
            Menu
          </button>
          <AdminTopbarContext />
          <AdminThemeToggle />
        </header>

        <main className="admin-main">{children}</main>

        <footer className="admin-shell-footer">
          <p className="admin-shell-footer-copy">
            Need a website for your conference?{" "}
            <a
              href="https://systemsummit.online"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-shell-footer-cta"
            >
              Contact now
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
