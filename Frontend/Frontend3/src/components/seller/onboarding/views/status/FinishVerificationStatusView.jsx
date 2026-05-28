import { CircleDashed } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SellerOnboardingCard } from '@/components/seller/onboarding/SellerOnboardingLayout';
import { OnboardingStatusSection } from './OnboardingStatusSection';

export function FinishVerificationStatusView({
  title,
  description,
  completedSteps,
  totalSteps,
  progressLabel,
  stepsTitle,
  steps = [],
  documentsTitle,
  documents = [],
  primaryActionLabel,
  onPrimaryAction,
  isPrimaryActionDisabled = false,
}) {
  const progressPercent =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="space-y-6">
      <SellerOnboardingCard>
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <p>{progressLabel}</p>
              <p className="font-medium">{progressPercent}%</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          {onPrimaryAction ? (
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={isPrimaryActionDisabled}
              onClick={onPrimaryAction}
            >
              {primaryActionLabel}
            </Button>
          ) : null}
        </div>
      </SellerOnboardingCard>

      {steps.length > 0 ? (
        <OnboardingStatusSection title={stepsTitle}>
          <ul className="space-y-3">
            {steps.map((step) => (
              <li
                key={step.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
              >
                <div className="flex items-start gap-3">
                  <CircleDashed
                    className={`mt-0.5 h-5 w-5 shrink-0 ${
                      step.completed ? 'text-primary' : 'text-muted-foreground'
                    }`}
                    aria-hidden
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{step.title}</p>
                    {step.statusLabel ? (
                      <p className="text-sm text-muted-foreground">{step.statusLabel}</p>
                    ) : null}
                  </div>
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
    </div>
  );
}
