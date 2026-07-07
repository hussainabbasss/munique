"use client";

import { useAdminTheme } from "@/components/admin/admin-theme-context";

export function AdminThemeToggle() {
  const { theme, toggleTheme } = useAdminTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="admin-theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className="admin-theme-toggle-track" aria-hidden>
        <span
          className={`admin-theme-toggle-thumb${isDark ? " admin-theme-toggle-thumb-dark" : ""}`}
        />
      </span>
      <span className="admin-theme-toggle-label">
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
}
