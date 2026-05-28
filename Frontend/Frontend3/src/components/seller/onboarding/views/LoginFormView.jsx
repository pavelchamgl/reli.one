import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  SellerOnboardingCard,
  OnboardingStepHeader,
  OnboardingAlert,
  FormField,
} from '@/components/seller/onboarding';

export function LoginFormView({
  title,
  description,
  emailLabel,
  passwordLabel,
  emailPlaceholder,
  passwordPlaceholder,
  values,
  errors,
  regErr,
  isLoading,
  isSubmitDisabled,
  submitLabel,
  forgotPasswordLabel,
  onForgotPasswordClick,
  noAccountLabel,
  signUpLabel,
  onSignUpClick,
  onFieldChange,
  onFieldBlur,
  onSubmit,
}) {
  return (
    <SellerOnboardingCard>
      <OnboardingStepHeader title={title} description={description} />
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <FormField id="email" label={emailLabel} error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={emailPlaceholder}
            value={values.email}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
          />
        </FormField>
        <FormField id="password" label={passwordLabel} error={errors.password}>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder={passwordPlaceholder}
            value={values.password}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
          />
        </FormField>
        <OnboardingAlert message={regErr} />
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitDisabled || isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? `${submitLabel}…` : submitLabel}
        </Button>
        <p className="text-center text-sm">
          <button
            type="button"
            onClick={onForgotPasswordClick}
            className="text-primary underline-offset-4 hover:underline"
          >
            {forgotPasswordLabel}
          </button>
        </p>
      </form>
      <div className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground">
        <span>{noAccountLabel}</span>
        <button
          type="button"
          onClick={onSignUpClick}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {signUpLabel}
        </button>
      </div>
    </SellerOnboardingCard>
  );
}
