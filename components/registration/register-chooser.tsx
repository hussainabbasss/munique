import Link from "next/link";
import { formatPkr } from "@/lib/utils/format";
import { computeFees } from "@/lib/registration/fees";
import type { PricingConfig } from "@/lib/types/admin";

type RegisterChooserProps = {
  pricing: PricingConfig;
};

export function RegisterChooser({ pricing }: RegisterChooserProps) {
  const delegateFees = computeFees(pricing, "delegate", 1);
  const delegationFees = computeFees(pricing, "delegation", 1);

  return (
    <ul className="registration-portal-list">
      <li>
        <Link
          href="/register/delegate"
          className="registration-portal-entry"
          aria-label={`Individual Delegate — ${formatPkr(delegateFees.perDelegateFee)} per person. Register as yourself.`}
        >
          <div>
            <span className="registration-portal-kicker">Portal I</span>
            <p className="registration-portal-title">Individual Delegate</p>
            <p className="registration-portal-desc">Register as yourself</p>
          </div>
          <div className="registration-portal-meta">
            {delegateFees.isEarlyBird && (
              <span className="registration-portal-fee-strike">
                {formatPkr(delegateFees.standardPerDelegateFee)}
              </span>
            )}
            <span className="registration-portal-fee">
              {formatPkr(delegateFees.perDelegateFee)}
              <span className="font-sans text-sm font-normal text-ink-navy-soft">
                {" "}
                / person
              </span>
            </span>
            <span className="registration-portal-arrow" aria-hidden="true">
              →
            </span>
          </div>
        </Link>
      </li>
      <li>
        <Link
          href="/register/delegation"
          className="registration-portal-entry"
          aria-label={`School Delegation — ${formatPkr(delegationFees.perDelegateFee)} per delegate. Register your institution's group.`}
        >
          <div>
            <span className="registration-portal-kicker">Portal II</span>
            <p className="registration-portal-title">School Delegation</p>
            <p className="registration-portal-desc">
              Register your institution&apos;s group
            </p>
          </div>
          <div className="registration-portal-meta">
            {delegationFees.isEarlyBird && (
              <span className="registration-portal-fee-strike">
                {formatPkr(delegationFees.standardPerDelegateFee)}
              </span>
            )}
            <span className="registration-portal-fee">
              {formatPkr(delegationFees.perDelegateFee)}
              <span className="font-sans text-sm font-normal text-ink-navy-soft">
                {" "}
                / delegate
              </span>
            </span>
            <span className="registration-portal-arrow" aria-hidden="true">
              →
            </span>
          </div>
        </Link>
      </li>
    </ul>
  );
}
