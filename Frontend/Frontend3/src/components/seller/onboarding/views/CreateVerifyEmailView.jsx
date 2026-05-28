import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SellerOnboardingCard,
  OnboardingStepHeader,
  OnboardingAlert,
} from '@/components/seller/onboarding';

export function CreateVerifyEmailView({
  title,
  description,
  email,
  step,
  totalSteps,
  stepLabel,
  pinInput,
  regErr,
  isLoading,
  isSubmitDisabled,
  submitLabel,
  resendTimerLabel,
  resendSeconds,
  resendLabel,
  onResend,
  onSubmit,
}) {
  return (
    <SellerOnboardingCard>
      <div className="flex justify-center">
        <Mail className="h-12 w-12 text-primary" aria-hidden />
      </div>
      <OnboardingStepHeader
        title={title}
        description={description}
        step={step}
        totalSteps={totalSteps}
        stepLabel={stepLabel}
      />
      <p className="text-center text-sm font-medium">{email}</p>
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        {pinInput}
        <OnboardingAlert message={regErr} />
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitDisabled || isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? `${submitLabel}…` : submitLabel}
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          {resendSeconds > 0 ? (
            <p>
              {resendTimerLabel}{' '}
              <span className="font-medium text-foreground">{resendSeconds}</span> s
            </p>
          ) : (
            <button
              type="button"
              onClick={onResend}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {resendLabel}
            </button>
          )}
        </div>
      </form>
    </SellerOnboardingCard>
  );
}
