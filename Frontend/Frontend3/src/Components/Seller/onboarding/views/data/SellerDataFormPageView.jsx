import { Button } from '@/Components/ui/button';
import { OnboardingStepHeader } from '@/Components/Seller/onboarding/OnboardingStepHeader';

export function SellerDataFormPageView({
  title,
  description,
  step,
  totalSteps,
  stepLabel,
  children,
  submitLabel,
  isSubmitDisabled,
  onSubmit,
}) {
  return (
    <div className="space-y-5">
      <OnboardingStepHeader
        title={title}
        description={description}
        step={step}
        totalSteps={totalSteps}
        stepLabel={stepLabel}
        centered
        className="pb-0"
      />
      <div className="space-y-6">{children}</div>
      <div className="flex justify-center">
        <Button
          type="button"
          className="h-12 w-full min-w-0 px-8 sm:w-auto sm:min-w-[14rem]"
          disabled={isSubmitDisabled}
          onClick={onSubmit}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
