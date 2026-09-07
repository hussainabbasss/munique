"use client";

import { formatPkr } from "@/lib/utils/format";
import {
  PAYMENT_WHATSAPP,
  paymentWhatsAppLink,
} from "@/lib/registration/payment";
import type { FeeBreakdown } from "@/lib/registration/types";
import type { PricingConfig } from "@/lib/types/admin";

type PaymentStepProps = {
  pricing: PricingConfig;
  fees: FeeBreakdown;
};

export function PaymentStep({ pricing, fees }: PaymentStepProps) {
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
        <div className="registration-payment-detail">
          <p className="registration-label">Submit payment proof</p>
          <p className="registration-payment-detail-value">
            After transferring, send your payment screenshot on WhatsApp to{" "}
            <a href={paymentWhatsAppLink()}>{PAYMENT_WHATSAPP}</a>. Include your
            registration ID once you receive it.
          </p>
        </div>
      </div>

      <p className="registration-payment-notice">
        Transfer the fee using the bank details above, then submit this form.
        Send your payment screenshot on WhatsApp after you register.{" "}
        <strong>Payment confirmation</strong> happens after staff verify your
        transfer — you will receive an email when that happens.
      </p>
    </div>
  );
}
