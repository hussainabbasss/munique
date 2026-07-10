import { RegistrationClosed } from "@/components/registration/registration-closed";
import { RegistrationWizard } from "@/components/registration/registration-wizard";
import { fetchActivePricing } from "@/lib/registration/queries";
import { fetchPublishedCommittees } from "@/lib/public/queries";
import "../register.css";

export default async function DelegationRegisterPage() {
  const [pricing, committees] = await Promise.all([
    fetchActivePricing(),
    fetchPublishedCommittees(),
  ]);

  if (!pricing) {
    return <RegistrationClosed />;
  }

  return (
    <>
      <h1 className="sr-only">Delegation Registration</h1>
      <RegistrationWizard
        portal="delegation"
        portalLabel="Delegation"
        committees={committees}
        pricing={pricing}
      />
    </>
  );
}
