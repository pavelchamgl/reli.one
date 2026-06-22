import { Check, X } from 'lucide-react';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import {
  SellerOnboardingCard,
  OnboardingStepHeader,
  OnboardingAlert,
  FormField,
} from '@/Components/Seller/onboarding';

export function CreatePassFormView({
  title,
  description,
  passwordLabel,
  passwordPlaceholder,
  confirmPasswordLabel,
  confirmPasswordPlaceholder,
  values,
  errors,
  regErr,
  isLoading,
  isSubmitDisabled,
  submitLabel,
  requirementsTitle,
  requirements = [],
  footerNote,
  onFieldChange,
  onFieldBlur,
  onSubmit,
}) {
  return (
    <SellerOnboardingCard>
      <OnboardingStepHeader title={title} description={description} />
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <FormField id="password" label={passwordLabel} error={errors.password}>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder={passwordPlaceholder}
            value={values.password}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
          />
        </FormField>
        <div className="rounded-lg border bg-muted/20 p-4">
          <p className="mb-3 text-sm font-medium">{requirementsTitle}</p>
          <ul className="space-y-2">
            {requirements.map((item) => (
              <li
                key={item.label}
                className={cn(
                  'flex items-center gap-2 text-sm',
                  item.met ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.met ? (
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                ) : (
                  <X className="h-4 w-4 shrink-0" aria-hidden />
                )}
                {item.label}
              </li>
            ))}
          </ul>
        </div>
        <FormField
          id="confirm_password"
          label={confirmPasswordLabel}
          error={errors.confirm_password}
        >
          <Input
            id="confirm_password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            placeholder={confirmPasswordPlaceholder}
            value={values.confirm_password}
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
      <p className="text-center text-sm text-muted-foreground">{footerNote}</p>
    </SellerOnboardingCard>
  );
}
