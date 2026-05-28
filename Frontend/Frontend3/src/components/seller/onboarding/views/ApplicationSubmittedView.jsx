import { CheckCircle2, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  SellerOnboardingCard,
  OnboardingStepHeader,
} from '@/components/seller/onboarding';

export function ApplicationSubmittedView({
  title,
  description,
  statusLabel,
  pendingStatusLabel,
  pendingTime,
  notification,
  nextTitle,
  nextSteps = [],
  returnHomeLabel,
  returnHomeHref,
  needHelpLabel,
  contactSupportLabel,
  contactSupportHref,
  onContactSupportClick,
}) {
  return (
    <SellerOnboardingCard>
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="h-16 w-16 text-primary" aria-hidden />
        <OnboardingStepHeader title={title} description={description} className="text-center" />
      </div>
      <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="space-y-1">
            <p className="text-sm font-medium">{statusLabel}</p>
            <Badge variant="secondary">{pendingStatusLabel}</Badge>
          </div>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{pendingTime}</p>
          <p>{notification}</p>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium">{nextTitle}</p>
        <ol className="space-y-2">
          {nextSteps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm text-muted-foreground">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
      <Button asChild variant="outline" className="w-full">
        <a href={returnHomeHref}>
          <Home className="mr-2 h-4 w-4" aria-hidden />
          {returnHomeLabel}
        </a>
      </Button>
      <div className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground">
        <span>{needHelpLabel}</span>
        <a
          href={contactSupportHref}
          onClick={onContactSupportClick}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {contactSupportLabel}
        </a>
      </div>
    </SellerOnboardingCard>
  );
}
