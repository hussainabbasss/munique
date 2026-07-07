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
      <header className="registration-page-header">
        <p className="registration-edition">Munique 2026 · Edition I</p>
        <h1 className="registration-page-title">Registration</h1>
        <p className="registration-page-lead">
          Select how you are applying to the conference. Each portal has its
          own fee — choose the path that matches your delegation.
        </p>
      </header>

      <RegisterChooser pricing={pricing} />

      <Link href="/" className="registration-back-link">
        ← Back to homepage
      </Link>
    </main>
  );
}
