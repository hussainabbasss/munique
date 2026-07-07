import Link from "next/link";
import { AdminLoginGraphic } from "@/components/admin/admin-login-graphic";
import { AdminThemeToggle } from "@/components/admin/admin-theme-toggle";
import { signInAction } from "@/lib/admin/actions/auth";
import "./login.css";

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Invalid email or password.",
  unconfirmed:
    "Email not confirmed. Ask an admin to reset your account or run the bootstrap script.",
  missing: "Email and password are required.",
  unauthorized:
    "This account is not on the EB allowlist. Ask an admin to add you under Team.",
  config: "Supabase is not configured. Set environment variables.",
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const errorMsg = params.error ? ERROR_MESSAGES[params.error] : null;
  const next = params.next ?? "/admin";

  return (
    <div className="admin-login">
      <div className="admin-login-toolbar">
        <AdminThemeToggle />
      </div>

      <aside className="admin-login-aside">
        <div className="admin-login-aside-inner">
          <AdminLoginGraphic />
          <div className="admin-login-aside-copyblock">
            <p className="admin-login-eyebrow">Edition I · 2026</p>
            <h1 className="admin-login-aside-title">Munique</h1>
            <p className="admin-login-aside-lead">
              Executive Board operations — registrations, conference content, and
              delegate management.
            </p>
          </div>
        </div>
      </aside>

      <div className="admin-login-main">
        <div className="admin-login-mobile-mark" aria-hidden>
          <AdminLoginGraphic compact />
        </div>

        <div className="admin-login-card">
          <header className="admin-login-card-header">
            <h2 className="admin-login-title">Sign in</h2>
            <p className="admin-login-lede">
              EB credentials only. This panel is not linked from the public site.
            </p>
          </header>

          {errorMsg && (
            <p className="admin-login-error" role="alert">
              {errorMsg}
            </p>
          )}

          <form action={signInAction} className="admin-login-form">
            <input type="hidden" name="next" value={next} />
            <div className="admin-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@school.edu"
              />
            </div>
            <div className="admin-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="btn-admin-primary btn-admin-weighty admin-login-submit"
            >
              Sign in
            </button>
          </form>

          <Link href="/" className="admin-login-back">
            ← Back to public site
          </Link>
        </div>
      </div>
    </div>
  );
}
