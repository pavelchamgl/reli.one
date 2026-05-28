import { Button } from '@/components/ui/button';
import {
  OnboardingStepHeader,
  SellerOnboardingCard,
} from '@/components/seller/onboarding';

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
    <div className="space-y-6">
      <SellerOnboardingCard>
        <OnboardingStepHeader
          title={title}
          description={description}
          step={step}
          totalSteps={totalSteps}
          stepLabel={stepLabel}
        />
      </SellerOnboardingCard>
      {children}
      <Button
        type="button"
        className="w-full sm:w-auto"
        disabled={isSubmitDisabled}
        onClick={onSubmit}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
