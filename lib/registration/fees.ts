import type { Portal } from "@/lib/registration/types";
import type { PricingConfig } from "@/lib/types/admin";

export function isEarlyBirdActive(pricing: PricingConfig): boolean {
  if (!pricing.early_bird_enabled || !pricing.early_bird_deadline) {
    return false;
  }

  const deadline = new Date(`${pricing.early_bird_deadline}T23:59:59+05:00`);
  return Date.now() <= deadline.getTime();
}

export function computeFees(
  pricing: PricingConfig,
  portal: Portal,
  delegateCount: number,
) {
  const earlyBird = isEarlyBirdActive(pricing);

  if (portal === "delegate") {
    const standardPerDelegateFee = pricing.delegate_fee;
    const perDelegateFee =
      earlyBird && pricing.early_bird_delegate_fee != null
        ? pricing.early_bird_delegate_fee
        : standardPerDelegateFee;

    return {
      perDelegateFee,
      totalFee: perDelegateFee,
      delegateCount: 1,
      isEarlyBird: earlyBird && perDelegateFee < standardPerDelegateFee,
      standardPerDelegateFee,
    };
  }

  const standardPerDelegateFee = pricing.delegation_fee;
  const perDelegateFee =
    earlyBird && pricing.early_bird_delegation_fee != null
      ? pricing.early_bird_delegation_fee
      : standardPerDelegateFee;

  return {
    perDelegateFee,
    totalFee: perDelegateFee * delegateCount,
    delegateCount,
    isEarlyBird: earlyBird && perDelegateFee < standardPerDelegateFee,
    standardPerDelegateFee,
  };
}
