import { Button } from '@/Components/ui/button';
import {
  SellerOnboardingCard,
  OnboardingStepHeader,
  OnboardingAlert,
} from '@/Components/Seller/onboarding';

export function VerifyFormView({
  backLabel,
  onBack,
  title,
  description,
  email,
  enterCodeLabel,
  pinInput,
  regErr,
  isLoading,
  isSubmitDisabled,
  submitLabel,
  resendTimerLabel,
  resendSeconds,
  resendLabel,
  onResend,
  didntReceiveLabel,
  onSubmit,
}) {
  return (
    <SellerOnboardingCard>
      <Button type="button" variant="ghost" className="-ml-2 w-fit px-2" onClick={onBack}>
        {backLabel}
      </Button>
      <OnboardingStepHeader title={title} description={description} />
      <p className="text-sm font-medium text-foreground">{email}</p>
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{enterCodeLabel}</p>
          {pinInput}
          <OnboardingAlert message={regErr} />
        </div>
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
      <p className="text-center text-sm text-muted-foreground">{didntReceiveLabel}</p>
    </SellerOnboardingCard>
  );
}
