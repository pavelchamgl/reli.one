import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import {
  SellerOnboardingCard,
  OnboardingStepHeader,
} from '@/Components/Seller/onboarding';

export function SellerSuccessfullyResetView({
  title,
  description,
  submitLabel,
  onSubmit,
  securityTipTitle,
  securityTipText,
}) {
  return (
    <>
      <SellerOnboardingCard>
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-16 w-16 text-primary" aria-hidden />
          <OnboardingStepHeader title={title} description={description} className="text-center" />
          <Button type="button" className="w-full" onClick={onSubmit}>
            {submitLabel}
          </Button>
        </div>
      </SellerOnboardingCard>
      <p className="text-center text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{securityTipTitle}</span>{' '}
        {securityTipText}
      </p>
    </>
  );
}
