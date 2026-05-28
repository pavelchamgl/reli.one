import { BadgeCheck, ChevronDown, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SellerOnboardingCard } from '@/components/seller/onboarding/SellerOnboardingLayout';
import { OnboardingStatusSection } from './OnboardingStatusSection';

export function VerifiedSellerStatusView({
  title,
  badgeLabel,
  description,
  approvedOnLabel,
  agreementTitle,
  agreementSignedLabel,
  agreementSignedOn,
  nextStepsTitle,
  nextSteps = [],
  benefitsTitle,
  benefits = [],
  documentsTitle,
  documents = [],
  lastUpdated,
}) {
  const [documentsOpen, setDocumentsOpen] = useState(false);

  return (
    <div className="space-y-6">
      <SellerOnboardingCard>
        <div className="flex items-start gap-4">
          <BadgeCheck className="h-10 w-10 shrink-0 text-primary" aria-hidden />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              {badgeLabel ? <Badge>{badgeLabel}</Badge> : null}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
            {approvedOnLabel ? <p className="text-sm font-medium">{approvedOnLabel}</p> : null}
          </div>
        </div>
      </SellerOnboardingCard>

      <OnboardingStatusSection title={agreementTitle}>
        <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="space-y-1">
            <p className="text-sm font-medium">{agreementSignedLabel}</p>
            {agreementSignedOn ? (
              <p className="text-sm text-muted-foreground">{agreementSignedOn}</p>
            ) : null}
          </div>
        </div>
      </OnboardingStatusSection>

      {nextSteps.length > 0 ? (
        <OnboardingStatusSection title={nextStepsTitle}>
          <ul className="space-y-3">
            {nextSteps.map((step) => (
              <li
                key={step.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{step.title}</p>
                  {step.description ? (
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  ) : null}
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

      {benefits.length > 0 ? (
        <OnboardingStatusSection title={benefitsTitle}>
          <div className="grid gap-4 md:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit.id} className="space-y-3 rounded-lg border bg-muted/20 p-4">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden />
                <div className="space-y-2">
                  <p className="text-sm font-medium">{benefit.title}</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {benefit.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </OnboardingStatusSection>
      ) : null}

      {documents.length > 0 ? (
        <OnboardingStatusSection>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 text-left"
            onClick={() => setDocumentsOpen((open) => !open)}
          >
            <h2 className="text-base font-semibold tracking-tight">{documentsTitle}</h2>
            <ChevronDown
              className={`h-5 w-5 shrink-0 transition-transform ${documentsOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
          {documentsOpen ? (
            <ul className="space-y-3 pt-4">
              {documents.map((document) => (
                <li
                  key={document.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{document.name}</p>
                    {document.verifiedOn ? (
                      <p className="text-sm text-muted-foreground">{document.verifiedOn}</p>
                    ) : null}
                  </div>
                  {document.statusLabel ? <Badge variant="secondary">{document.statusLabel}</Badge> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </OnboardingStatusSection>
      ) : null}

      {lastUpdated ? <p className="text-center text-xs text-muted-foreground">{lastUpdated}</p> : null}
    </div>
  );
}
