type WizardProgressProps = {
  currentStep: number;
  totalSteps: number;
  stepName: string;
};

export function WizardProgress({
  currentStep,
  totalSteps,
  stepName,
}: WizardProgressProps) {
  const progressPct = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="registration-progress" aria-label="Registration progress">
      <div className="registration-progress-meta">
        <p className="registration-progress-label">
          Step {currentStep} of {totalSteps}
        </p>
        <p className="registration-progress-step-name">{stepName}</p>
      </div>
      <div
        className="registration-progress-track"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Step ${currentStep} of ${totalSteps}`}
      >
        <div
          className="registration-progress-fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
