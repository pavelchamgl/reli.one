import { Button } from '@/components/ui/button';
import { OnboardingAlert } from '@/components/seller/onboarding/OnboardingAlert';
import { OnboardingStepHeader } from '@/components/seller/onboarding/OnboardingStepHeader';
import { SellerOnboardingCard } from '@/components/seller/onboarding/SellerOnboardingLayout';

export function SellerReviewPageView({
  title,
  description,
  step,
  totalSteps,
  stepLabel,
  submitLabel,
  submitError,
  isSubmittable = true,
  isSubmitting = false,
  onSubmit,
  children,
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

      {submitError ? <OnboardingAlert message={submitError} /> : null}

      <div className="space-y-4">{children}</div>

      <Button
        type="button"
        className="w-full sm:w-auto"
        disabled={!isSubmittable || isSubmitting}
        onClick={onSubmit}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
