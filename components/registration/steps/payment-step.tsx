"use client";

import { formatPkr } from "@/lib/utils/format";
import type { FeeBreakdown } from "@/lib/registration/types";
import type { PricingConfig } from "@/lib/types/admin";

type PaymentStepProps = {
  pricing: PricingConfig;
  fees: FeeBreakdown;
};

export function PaymentStep({ pricing, fees }: PaymentStepProps) {
  return (
    <div>
      <div className="registration-fee-callout">
        {fees.delegateCount > 1 ? (
          <>
            {formatPkr(fees.perDelegateFee)} × {fees.delegateCount} ={" "}
            <strong>{formatPkr(fees.totalFee)}</strong>
          </>
        ) : (
          <>
            Registration fee: <strong>{formatPkr(fees.totalFee)}</strong>
          </>
        )}
        {fees.isEarlyBird && (
          <p className="registration-fee-note">Early bird pricing applied</p>
        )}
      </div>

      <div className="registration-dossier-block">
        <p className="registration-label">Account title</p>
        <p className="registration-dossier-value">
          {pricing.bank_account_title}
        </p>
      </div>
      <div className="registration-dossier-block">
        <p className="registration-label">Bank details</p>
        <p className="registration-dossier-value">{pricing.bank_details}</p>
      </div>
      <div className="registration-dossier-block">
        <p className="registration-label">Payment instructions</p>
        <p className="registration-dossier-value">
          {pricing.payment_instructions}
        </p>
      </div>

      <p className="registration-payment-notice">
        Transfer the fee using the bank details above. Your registration is
        received when you submit this form.{" "}
        <strong>Payment confirmation</strong> happens after staff verify your
        transfer — you will receive an email when that happens.
      </p>
    </div>
  );
}
