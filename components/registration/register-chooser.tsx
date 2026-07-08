import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { formatPkr } from "@/lib/utils/format";
import { computeFees } from "@/lib/registration/fees";
import {
  DELEGATION_MAX_DELEGATES,
  DELEGATION_MIN_DELEGATES,
} from "@/lib/registration/types";
import type { PricingConfig } from "@/lib/types/admin";

type RegisterChooserProps = {
  pricing: PricingConfig;
};

export function RegisterChooser({ pricing }: RegisterChooserProps) {
  const delegateFees = computeFees(pricing, "delegate", 1);
  const delegationFees = computeFees(pricing, "delegation", 1);

  return (
    <ul className="registration-portals">
      <Reveal as="li" className="registration-portal-cell">
        <Link
          href="/register/delegate"
          className="registration-portal"
          aria-label={`Individual Delegate — ${formatPkr(delegateFees.perDelegateFee)} per person. Register as yourself.`}
        >
          <p className="registration-portal-kicker">Portal I — Individual</p>
          <p className="registration-portal-title">Individual Delegate</p>
          <p className="registration-portal-desc">Register as yourself.</p>
          <ul className="registration-portal-spec" aria-hidden="true">
            <li>For — one delegate, any school</li>
            <li>Need — email · committee preferences</li>
            <li>Need — payment proof screenshot</li>
          </ul>
          <div className="registration-portal-meta">
            <div className="registration-portal-fee-block">
              {delegateFees.isEarlyBird && (
                <span className="registration-portal-fee-strike">
                  {formatPkr(delegateFees.standardPerDelegateFee)}
                </span>
              )}
              <span className="registration-portal-fee">
                {formatPkr(delegateFees.perDelegateFee)}
                <span className="registration-portal-fee-unit">
                  {" "}
                  / person
                </span>
              </span>
            </div>
            <span className="registration-portal-arrow" aria-hidden="true">
              →
            </span>
          </div>
        </Link>
      </Reveal>
      <Reveal as="li" className="registration-portal-cell" delay={100}>
        <Link
          href="/register/delegation"
          className="registration-portal"
          aria-label={`School Delegation — ${formatPkr(delegationFees.perDelegateFee)} per delegate. Register your institution's group.`}
        >
          <p className="registration-portal-kicker">Portal II — Schools</p>
          <p className="registration-portal-title">School Delegation</p>
          <p className="registration-portal-desc">
            Register your institution&apos;s group.
          </p>
          <ul className="registration-portal-spec" aria-hidden="true">
            <li>
              For — schools, {DELEGATION_MIN_DELEGATES}–
              {DELEGATION_MAX_DELEGATES} delegates
            </li>
            <li>Need — head delegate · member list</li>
            <li>Need — payment proof screenshot</li>
          </ul>
          <div className="registration-portal-meta">
            <div className="registration-portal-fee-block">
              {delegationFees.isEarlyBird && (
                <span className="registration-portal-fee-strike">
                  {formatPkr(delegationFees.standardPerDelegateFee)}
                </span>
              )}
              <span className="registration-portal-fee">
                {formatPkr(delegationFees.perDelegateFee)}
                <span className="registration-portal-fee-unit">
                  {" "}
                  / delegate
                </span>
              </span>
            </div>
            <span className="registration-portal-arrow" aria-hidden="true">
              →
            </span>
          </div>
        </Link>
      </Reveal>
    </ul>
  );
}
