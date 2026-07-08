"use client";

import { formatPkr } from "@/lib/utils/format";
import type { FeeBreakdown } from "@/lib/registration/types";
import type { PricingConfig } from "@/lib/types/admin";

type PaymentStepProps = {
  pricing: PricingConfig;
  fees: FeeBreakdown;
  paymentProofFile: File | null;
  onPaymentProofFileChange: (file: File | null) => void;
};

export function PaymentStep({
  pricing,
  fees,
  paymentProofFile,
  onPaymentProofFileChange,
}: PaymentStepProps) {
  return (
    <div>
      <div className="registration-payment-plate">
        <p className="registration-payment-plate-label">Amount due</p>
        <p className="registration-fee-line">
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
        </p>
        {fees.isEarlyBird && (
          <p className="registration-fee-note">Early bird pricing applied</p>
        )}

        <div className="registration-payment-detail">
          <p className="registration-label">Account title</p>
          <p className="registration-payment-detail-value">
            {pricing.bank_account_title}
          </p>
        </div>
        <div className="registration-payment-detail">
          <p className="registration-label">Bank details</p>
          <p className="registration-payment-detail-value">
            {pricing.bank_details}
          </p>
        </div>
        <div className="registration-payment-detail">
          <p className="registration-label">Payment instructions</p>
          <p className="registration-payment-detail-value">
            {pricing.payment_instructions}
          </p>
        </div>
      </div>

      <p className="registration-payment-notice">
        Transfer the fee using the bank details above. Upload your payment
        screenshot in the section below. Your registration is received when
        you submit this form.{" "}
        <strong>Payment confirmation</strong> happens after staff verify your
        transfer — you will receive an email when that happens.
      </p>

      <div className="registration-file-field" aria-labelledby="payment-proof-label">
        <label id="payment-proof-label" className="registration-label" htmlFor="payment-proof">
          Payment proof screenshot
        </label>
        <input
          id="payment-proof"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.currentTarget.files?.[0] ?? null;
            onPaymentProofFileChange(file);
          }}
        />
        <p className="registration-hint">
          {paymentProofFile
            ? `Selected: ${paymentProofFile.name}`
            : "Upload a screenshot/photo of your payment confirmation."}
        </p>
      </div>
    </div>
  );
}
