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
  return (
    <div className="registration-progress" aria-label="Registration progress">
      <div className="registration-progress-meta">
        <p className="registration-progress-label">
          Step {String(currentStep).padStart(2, "0")} /{" "}
          {String(totalSteps).padStart(2, "0")}
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
        {Array.from({ length: totalSteps }, (_, index) => (
          <span
            key={index}
            className={`registration-progress-seg${
              index < currentStep ? " registration-progress-seg-done" : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}
