"use client";

import { useActionState } from "react";
import { savePricingAction } from "@/lib/admin/actions/pricing";
import type { PricingConfig } from "@/lib/types/admin";

type Props = {
  config: PricingConfig | null;
  canEdit: boolean;
};

export function PricingForm({ config, canEdit }: Props) {
  const [state, action, pending] = useActionState(
    async (_prev: { success?: string; error?: string } | null, formData: FormData) => {
      if (!canEdit) return { error: "Only admins can edit pricing." };
      return savePricingAction(formData);
    },
    null,
  );

  return (
    <form action={action} className="admin-form-grid">
      {state?.success && (
        <p className="admin-toast admin-toast-success">{state.success}</p>
      )}
      {state?.error && (
        <p className="admin-toast admin-toast-error">{state.error}</p>
      )}

      <fieldset disabled={!canEdit}>
        <h3 className="admin-panel-title">Delegate portal (/register/delegate)</h3>
        <div className="admin-field">
          <label htmlFor="delegate_fee">Fee (PKR)</label>
          <input
            id="delegate_fee"
            name="delegate_fee"
            type="number"
            min={0}
            step={1}
            defaultValue={config?.delegate_fee ?? 4500}
            required
          />
          <p className="admin-field-hint">Per delegate</p>
        </div>

        <hr className="admin-section-divider" />

        <h3 className="admin-panel-title">
          Delegation portal (/register/delegation)
        </h3>
        <div className="admin-field">
          <label htmlFor="delegation_fee">Fee (PKR)</label>
          <input
            id="delegation_fee"
            name="delegation_fee"
            type="number"
            min={0}
            step={1}
            defaultValue={config?.delegation_fee ?? 3800}
            required
          />
          <p className="admin-field-hint">Per delegate in group</p>
        </div>

        <hr className="admin-section-divider" />

        <h3 className="admin-panel-title">Early bird (optional)</h3>
        <div className="admin-checkbox-row">
          <input
            id="early_bird_enabled"
            name="early_bird_enabled"
            type="checkbox"
            defaultChecked={config?.early_bird_enabled ?? false}
          />
          <label htmlFor="early_bird_enabled">Enable early bird pricing</label>
        </div>
        <div className="admin-field">
          <label htmlFor="early_bird_deadline">Deadline</label>
          <input
            id="early_bird_deadline"
            name="early_bird_deadline"
            type="date"
            defaultValue={config?.early_bird_deadline ?? ""}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="early_bird_delegate_fee">Delegate portal early bird</label>
          <input
            id="early_bird_delegate_fee"
            name="early_bird_delegate_fee"
            type="number"
            defaultValue={config?.early_bird_delegate_fee ?? ""}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="early_bird_delegation_fee">
            Delegation portal early bird
          </label>
          <input
            id="early_bird_delegation_fee"
            name="early_bird_delegation_fee"
            type="number"
            defaultValue={config?.early_bird_delegation_fee ?? ""}
          />
          <p className="admin-field-hint">Per delegate</p>
        </div>

        <hr className="admin-section-divider" />

        <h3 className="admin-panel-title">Bank details</h3>
        <p className="admin-field-hint" style={{ marginBottom: "1rem" }}>
          Shown on both portals&apos; payment step
        </p>
        <div className="admin-field">
          <label htmlFor="bank_account_title">Account title</label>
          <input
            id="bank_account_title"
            name="bank_account_title"
            defaultValue={config?.bank_account_title ?? ""}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="bank_details">Bank / IBAN</label>
          <textarea id="bank_details" name="bank_details" defaultValue={config?.bank_details ?? ""} />
        </div>
        <div className="admin-field">
          <label htmlFor="payment_instructions">Instructions</label>
          <textarea
            id="payment_instructions"
            name="payment_instructions"
            defaultValue={config?.payment_instructions ?? ""}
          />
        </div>
      </fieldset>

      {canEdit && (
        <div className="admin-actions">
          <button type="submit" className="btn-admin-primary" disabled={pending}>
            {pending ? "Saving…" : "Save pricing"}
          </button>
        </div>
      )}
    </form>
  );
}
