import { Button } from '@/components/ui/button';
import { OnboardingAlert } from '@/components/seller/onboarding/OnboardingAlert';
import { OnboardingStepHeader } from '@/components/seller/onboarding/OnboardingStepHeader';

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
    <div className="space-y-5">
      <OnboardingStepHeader
        title={title}
        description={description}
        step={step}
        totalSteps={totalSteps}
        stepLabel={stepLabel}
        centered
      />

      {submitError ? <OnboardingAlert message={submitError} /> : null}

      <div className="space-y-6">{children}</div>

      <div className="flex justify-center">
        <Button
          type="button"
          className="h-12 w-full min-w-0 px-8 sm:w-auto sm:min-w-[14rem]"
          disabled={!isSubmittable || isSubmitting}
          onClick={onSubmit}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
