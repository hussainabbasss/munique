"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { WizardProgress } from "@/components/registration/wizard-progress";
import { AboutStep } from "@/components/registration/steps/about-step";
import { SchoolHeadStep } from "@/components/registration/steps/school-head-step";
import { DelegationMembersStep } from "@/components/registration/steps/delegation-members-step";
import { CommitteePrefsStep } from "@/components/registration/steps/committee-prefs-step";
import { PaymentStep } from "@/components/registration/steps/payment-step";
import { ReviewStep } from "@/components/registration/steps/review-step";
import { ConfirmationStep } from "@/components/registration/steps/confirmation-step";
import { useRegistrationDraft } from "@/lib/registration/draft";
import { computeFees } from "@/lib/registration/fees";
import { submitRegistrationAction } from "@/lib/registration/submit";
import {
  getDelegateCount,
  validateCommitteePrefs,
  validateDelegateAbout,
  validateDelegationMembers,
  validateDelegationSchoolHead,
} from "@/lib/registration/validation";
import type {
  DelegateDraft,
  DelegationDraft,
  RegistrationWizardProps,
} from "@/lib/registration/types";

const DELEGATE_STEPS = [
  { title: "About you" },
  { title: "Committee preferences" },
  { title: "Payment" },
  { title: "Review" },
  { title: "Confirmation" },
] as const;

const DELEGATION_STEPS = [
  { title: "School & head delegate" },
  { title: "Your delegation" },
  { title: "Committee preferences" },
  { title: "Payment" },
  { title: "Review" },
  { title: "Confirmation" },
] as const;

export function RegistrationWizard({
  portal,
  portalLabel,
  committees,
  pricing,
}: RegistrationWizardProps) {
  const steps = portal === "delegate" ? DELEGATE_STEPS : DELEGATION_STEPS;
  const totalSteps = steps.length;
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    registrationId: string;
    headEmail: string;
  } | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const { draft, updateDraft, hydrated } = useRegistrationDraft(portal);

  const delegateCount = useMemo(
    () => getDelegateCount(portal, draft),
    [portal, draft],
  );

  const fees = useMemo(
    () => computeFees(pricing, portal, delegateCount),
    [pricing, portal, delegateCount],
  );

  const currentStep = stepIndex + 1;
  const isConfirmation = stepIndex === totalSteps - 1;
  const isReview =
    portal === "delegate" ? stepIndex === 3 : stepIndex === 4;

  useEffect(() => {
    if (!hydrated) return;
    titleRef.current?.focus();
  }, [stepIndex, hydrated]);

  const validateCurrentStep = () => {
    if (portal === "delegate") {
      const delegateDraft = draft as DelegateDraft;
      if (stepIndex === 0) return validateDelegateAbout(delegateDraft);
      if (stepIndex === 1) {
        if (committees.length === 0) {
          return "Committee preferences are unavailable. Please contact the EB.";
        }
        return validateCommitteePrefs(delegateDraft, committees);
      }
      return null;
    }

    const delegationDraft = draft as DelegationDraft;
    if (stepIndex === 0) return validateDelegationSchoolHead(delegationDraft);
    if (stepIndex === 1) return validateDelegationMembers(delegationDraft);
    if (stepIndex === 2) {
      if (committees.length === 0) {
        return "Committee preferences are unavailable. Please contact the EB.";
      }
      return validateCommitteePrefs(delegationDraft, committees);
    }
    return null;
  };

  const goNext = () => {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStepIndex((index) => Math.min(index + 1, totalSteps - 1));
  };

  const goBack = () => {
    setError(null);
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("portal", portal);

      if (portal === "delegate") {
        const delegateDraft = draft as DelegateDraft;
        formData.set("full_name", delegateDraft.fullName);
        formData.set("email", delegateDraft.email);
        formData.set("school", delegateDraft.school);
      } else {
        const delegationDraft = draft as DelegationDraft;
        formData.set("school", delegationDraft.school);
        formData.set("head_name", delegationDraft.headName);
        formData.set("head_email", delegationDraft.headEmail);
        formData.set("members", JSON.stringify(delegationDraft.members));
      }

      formData.set("committee_pref_1", draft.committeePref1);
      formData.set("committee_pref_2", draft.committeePref2);
      formData.set("committee_pref_3", draft.committeePref3);
      formData.set("mun_experience", draft.munExperience);

      const response = await submitRegistrationAction(formData);

      if (!response.ok) {
        setSubmitError(response.error);
        return;
      }

      setResult({
        registrationId: response.registrationId,
        headEmail: response.headEmail,
      });
      setStepIndex(totalSteps - 1);
    } catch {
      setSubmitError(
        "Registration could not be submitted. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated) {
    return (
      <main id="main" className="registration-wizard" aria-busy="true">
        <div className="registration-masthead">
          <p className="registration-masthead-trail">
            <Link href="/register">Registration</Link>
            <span aria-hidden="true"> · </span>
            {portalLabel}
          </p>
        </div>
        <p className="sr-only">Loading registration form</p>
        <div className="registration-loading" aria-hidden="true">
          <div className="registration-loading-line" />
          <div className="registration-loading-line" />
          <div className="registration-loading-line" />
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="registration-wizard">
      <header className="registration-masthead">
        <p className="registration-masthead-trail">
          <Link href="/register">Registration</Link>
          <span aria-hidden="true"> · </span>
          <span className="registration-masthead-portal">{portalLabel}</span>
        </p>
      </header>

      {!isConfirmation && (
        <WizardProgress
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepName={steps[stepIndex].title}
        />
      )}

      {!isConfirmation && (
        <div className="registration-step-header">
          <h2
            ref={titleRef}
            tabIndex={-1}
            className="registration-step-title"
          >
            {steps[stepIndex].title}
          </h2>
        </div>
      )}

      {error && (
        <p className="registration-error" role="alert">
          {error}
        </p>
      )}

      <div className="registration-form-body">
        {portal === "delegate" && stepIndex === 0 && (
          <AboutStep draft={draft as DelegateDraft} onChange={updateDraft} />
        )}

        {portal === "delegation" && stepIndex === 0 && (
          <SchoolHeadStep
            draft={draft as DelegationDraft}
            onChange={updateDraft}
          />
        )}

        {portal === "delegation" && stepIndex === 1 && (
          <DelegationMembersStep
            draft={draft as DelegationDraft}
            onChange={updateDraft}
          />
        )}

        {((portal === "delegate" && stepIndex === 1) ||
          (portal === "delegation" && stepIndex === 2)) && (
          <CommitteePrefsStep
            committees={committees}
            draft={draft}
            onChange={updateDraft}
          />
        )}

        {((portal === "delegate" && stepIndex === 2) ||
          (portal === "delegation" && stepIndex === 3)) && (
          <PaymentStep pricing={pricing} fees={fees} />
        )}

        {isReview && (
          <ReviewStep
            portal={portal}
            draft={draft}
            committees={committees}
            fees={fees}
            onEdit={(index) => {
              setSubmitError(null);
              setStepIndex(index);
            }}
            onBack={goBack}
            submitting={submitting}
            error={submitError}
            onSubmit={handleSubmit}
          />
        )}

        {isConfirmation && result && (
          <ConfirmationStep
            portal={portal}
            registrationId={result.registrationId}
            headEmail={result.headEmail}
          />
        )}
      </div>

      {!isReview && !isConfirmation && (
        <div className="registration-wizard-nav">
          {stepIndex > 0 ? (
            <button
              type="button"
              className="registration-btn-back"
              onClick={goBack}
            >
              ← Back
            </button>
          ) : (
            <Link href="/register" className="registration-btn-back">
              ← Back
            </Link>
          )}
          <button
            type="button"
            className="btn-primary registration-nav-primary"
            onClick={goNext}
          >
            Continue →
          </button>
        </div>
      )}
    </main>
  );
}
