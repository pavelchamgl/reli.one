import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { OnboardingAlert } from '@/components/seller/onboarding/OnboardingAlert';
import { SellerOnboardingCard } from '@/components/seller/onboarding/SellerOnboardingLayout';
import { OnboardingStatusSection } from './OnboardingStatusSection';

export function ActionRequiredStatusView({
  title,
  description,
  feedbackTitle,
  feedbackItems = [],
  stepsTitle,
  steps = [],
  documentsTitle,
  documents = [],
  primaryActionLabel,
  onPrimaryAction,
  alertMessage,
}) {
  return (
    <div className="space-y-6">
      <SellerOnboardingCard>
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-10 w-10 shrink-0 text-destructive" aria-hidden />
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </SellerOnboardingCard>

      {alertMessage ? <OnboardingAlert message={alertMessage} /> : null}

      {feedbackItems.length > 0 ? (
        <OnboardingStatusSection title={feedbackTitle}>
          <ul className="space-y-3">
            {feedbackItems.map((item) => (
              <li key={item.id} className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
              </li>
            ))}
          </ul>
        </OnboardingStatusSection>
      ) : null}

      {steps.length > 0 ? (
        <OnboardingStatusSection title={stepsTitle}>
          <ul className="space-y-3">
            {steps.map((step) => (
              <li
                key={step.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{step.title}</p>
                  {step.statusLabel ? (
                    <p className="text-sm text-muted-foreground">{step.statusLabel}</p>
                  ) : null}
                  {step.detail ? <p className="text-sm text-destructive">{step.detail}</p> : null}
                </div>
                {step.actionLabel && step.onAction ? (
                  <Button type="button" size="sm" variant="outline" onClick={step.onAction}>
                    {step.actionLabel}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </OnboardingStatusSection>
      ) : null}

      {documents.length > 0 ? (
        <OnboardingStatusSection title={documentsTitle}>
          <ul className="space-y-3">
            {documents.map((document) => (
              <li
                key={document.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{document.name}</p>
                  {document.detail ? (
                    <p className="text-sm text-muted-foreground">{document.detail}</p>
                  ) : null}
                  {document.uploadedAt ? (
                    <p className="text-sm text-muted-foreground">{document.uploadedAt}</p>
                  ) : null}
                </div>
                {document.actionLabel && document.onAction ? (
                  <Button type="button" size="sm" variant="outline" onClick={document.onAction}>
                    {document.actionLabel}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </OnboardingStatusSection>
      ) : null}

      {onPrimaryAction ? (
        <Button type="button" className="w-full sm:w-auto" onClick={onPrimaryAction}>
          {primaryActionLabel}
        </Button>
      ) : null}
    </div>
  );
}
