"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  readStoredAdminTheme,
  storeAdminTheme,
  type AdminTheme,
} from "@/lib/admin/theme";

type AdminThemeContextValue = {
  theme: AdminTheme;
  toggleTheme: () => void;
};

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>("light");
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    setTheme(readStoredAdminTheme() ?? "light");
    setReady(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: AdminTheme = current === "light" ? "dark" : "light";
      storeAdminTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme }),
    [theme, toggleTheme],
  );

  return (
    <AdminThemeContext.Provider value={value}>
      <div
        className="admin-theme-root"
        data-theme={theme}
        data-admin-theme-ready={ready ? "true" : "false"}
      >
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error("useAdminTheme must be used within AdminThemeProvider");
  }
  return context;
}
