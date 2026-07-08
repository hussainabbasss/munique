import Link from "next/link";
import { RegisterChooser } from "@/components/registration/register-chooser";
import { RegistrationClosed } from "@/components/registration/registration-closed";
import { fetchActivePricing } from "@/lib/registration/queries";
import "./register.css";

export default async function RegisterPage() {
  const pricing = await fetchActivePricing();

  if (!pricing) {
    return <RegistrationClosed />;
  }

  return (
    <main id="main" className="registration-page">
      <header className="hall registration-hall">
        <div className="hall-inner">
          <p className="hall-meta">
            <span>Registration</span>
            <span>Edition I</span>
            <span>Capacity 250–300</span>
          </p>
          <h1 className="hall-title">Registration</h1>
          <p className="hall-lede">
            Two portals into the assembly. Each carries its own fee — choose
            the path that matches your delegation.
          </p>
        </div>
      </header>

      <section
        className="sheet registration-chooser"
        aria-label="Registration portals"
      >
        <RegisterChooser pricing={pricing} />

        <Link href="/" className="arrow-cta registration-back">
          <span className="arrow" aria-hidden="true">
            ←
          </span>
          Back to homepage
        </Link>
      </section>
    </main>
  );
}
