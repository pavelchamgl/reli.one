import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import {
  SellerOnboardingCard,
  OnboardingStepHeader,
  OnboardingAlert,
  FormField,
} from '@/Components/Seller/onboarding';

export function ResetFormView({
  backLabel,
  onBack,
  title,
  description,
  emailLabel,
  emailPlaceholder,
  values,
  errors,
  regErr,
  isLoading,
  isSubmitDisabled,
  submitLabel,
  rememberPasswordLabel,
  loginInsteadLabel,
  onLoginClick,
  onFieldChange,
  onFieldBlur,
  onSubmit,
}) {
  return (
    <SellerOnboardingCard>
      <Button type="button" variant="ghost" className="-ml-2 w-fit px-2" onClick={onBack}>
        {backLabel}
      </Button>
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
        <OnboardingAlert message={regErr} />
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitDisabled || isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? `${submitLabel}…` : submitLabel}
        </Button>
      </form>
      <div className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground">
        <span>{rememberPasswordLabel}</span>
        <button
          type="button"
          onClick={onLoginClick}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {loginInsteadLabel}
        </button>
      </div>
    </SellerOnboardingCard>
  );
}
