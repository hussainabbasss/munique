import Link from "next/link";

export function RegistrationClosed() {
  return (
    <main id="main" className="registration-page">
      <header className="registration-page-header">
        <p className="registration-edition">Munique 2026 · Edition I</p>
        <h1 className="registration-page-title">Registration</h1>
        <p className="registration-page-lead">
          Registration is not open yet.
        </p>
      </header>
      <Link href="/" className="registration-back-link">
        ← Back to homepage
      </Link>
    </main>
  );
}
