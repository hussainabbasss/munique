import Link from "next/link";
import { SealLine } from "@/components/seal-line";

export function RegistrationClosed() {
  return (
    <main id="main" className="registration-closed">
      <SealLine className="registration-closed-seal" aria-hidden="true" />
      <div className="registration-closed-inner">
        <p className="registration-closed-meta">
          <span>Munique &rsquo;26</span>
          <span>Edition I</span>
          <span>Notice</span>
        </p>
        <h1 className="display display-lg registration-closed-title">
          Registration is closed
        </h1>
        <p className="registration-closed-copy">
          The portal is not accepting entries right now. Follow @munique_2026
          for the next notice.
        </p>
        <Link href="/" className="btn btn-outline-dark">
          Return to homepage
        </Link>
      </div>
    </main>
  );
}
