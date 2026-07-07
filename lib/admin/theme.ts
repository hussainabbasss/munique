export const ADMIN_THEME_STORAGE_KEY = "munique-admin-theme";

export type AdminTheme = "light" | "dark";

export function isAdminTheme(value: string | null): value is AdminTheme {
  return value === "light" || value === "dark";
}

export function readStoredAdminTheme(): AdminTheme | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
    return isAdminTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function storeAdminTheme(theme: AdminTheme) {
  try {
    localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore quota / private mode */
  }
}
