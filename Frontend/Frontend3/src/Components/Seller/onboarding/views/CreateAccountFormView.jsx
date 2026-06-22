import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import {
  SellerOnboardingCard,
  OnboardingStepHeader,
  OnboardingAlert,
  FormField,
} from '@/Components/Seller/onboarding';

export function CreateAccountFormView({
  title,
  description,
  step,
  totalSteps,
  stepLabel,
  fields,
  values,
  errors,
  regErr,
  isLoading,
  isSubmitDisabled,
  submitLabel,
  isAgree,
  agreeText,
  termsHref,
  termsLabel,
  andLabel,
  privacyLabel,
  onPrivacyClick,
  onFieldChange,
  onFieldBlur,
  onPhoneChange,
  onPhoneFocus,
  onAgreeChange,
  onSubmit,
}) {
  return (
    <SellerOnboardingCard>
      <OnboardingStepHeader
        title={title}
        description={description}
        step={step}
        totalSteps={totalSteps}
        stepLabel={stepLabel}
      />
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.slice(0, 2).map((field) => (
            <FormField
              key={field.name}
              id={field.name}
              label={field.label}
              error={errors[field.name]}
              required
            >
              <Input
                id={field.name}
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                value={values[field.name]}
                onChange={onFieldChange}
                onBlur={onFieldBlur}
              />
            </FormField>
          ))}
        </div>
        {fields.slice(2).map((field) => (
          <FormField
            key={field.name}
            id={field.name}
            label={field.label}
            error={errors[field.name]}
            required
          >
            <Input
              id={field.name}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={values[field.name]}
              onChange={field.name === 'phone_number' ? onPhoneChange : onFieldChange}
              onFocus={field.name === 'phone_number' ? onPhoneFocus : undefined}
              onBlur={onFieldBlur}
            />
          </FormField>
        ))}
        <OnboardingAlert message={regErr} />
        <div className="flex items-start gap-3">
          <Checkbox
            id="agree"
            checked={isAgree}
            onCheckedChange={onAgreeChange}
          />
          <div className="text-sm leading-relaxed text-muted-foreground">
            <label htmlFor="agree" className="cursor-pointer">
              {agreeText}
            </label>{' '}
            <a
              href={termsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              {termsLabel}
            </a>{' '}
            {andLabel}{' '}
            <button
              type="button"
              onClick={onPrivacyClick}
              className="text-primary underline-offset-4 hover:underline"
            >
              {privacyLabel}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitDisabled || isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? `${submitLabel}…` : submitLabel}
        </Button>
      </form>
    </SellerOnboardingCard>
  );
}
