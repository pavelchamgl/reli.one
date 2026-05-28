import { Clock3, MessageCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SellerOnboardingCard } from '@/components/seller/onboarding/SellerOnboardingLayout';
import { OnboardingStatusSection } from './OnboardingStatusSection';

function TimelineStep({ label, meta, status }) {
  const statusClass =
    status === 'completed'
      ? 'border-primary bg-primary text-primary-foreground'
      : status === 'current'
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-border bg-muted text-muted-foreground';

  return (
    <li className="flex gap-3">
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${statusClass}`}
      >
        {status === 'completed' ? '✓' : status === 'current' ? '…' : ''}
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">{label}</p>
        {meta ? <p className="text-sm text-muted-foreground">{meta}</p> : null}
      </div>
    </li>
  );
}

export function UnderReviewStatusView({
  title,
  description,
  statusBadgeLabel,
  timelineTitle,
  timelineSteps = [],
  infoSections = [],
  documentsTitle,
  documents = [],
  nextTitle,
  nextDescription,
  contactSupportLabel,
  onContactSupport,
  lastUpdated,
}) {
  return (
    <div className="space-y-6">
      <SellerOnboardingCard>
        <div className="flex items-start gap-4">
          <Clock3 className="h-10 w-10 shrink-0 text-primary" aria-hidden />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              {statusBadgeLabel ? <Badge variant="secondary">{statusBadgeLabel}</Badge> : null}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </SellerOnboardingCard>

      {timelineSteps.length > 0 ? (
        <OnboardingStatusSection title={timelineTitle}>
          <ol className="space-y-4">
            {timelineSteps.map((step) => (
              <TimelineStep key={step.id} {...step} />
            ))}
          </ol>
        </OnboardingStatusSection>
      ) : null}

      {infoSections.map((section) => (
        <OnboardingStatusSection key={section.title} title={section.title}>
          <dl className="grid gap-3 sm:grid-cols-2">
            {section.rows.map(({ label, value, mono }) => (
              <div key={label} className="space-y-1">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className={`text-sm font-medium ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</dd>
              </div>
            ))}
          </dl>
        </OnboardingStatusSection>
      ))}

      {documents.length > 0 ? (
        <OnboardingStatusSection title={documentsTitle}>
          <ul className="space-y-3">
            {documents.map((document) => (
              <li
                key={document.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border bg-muted/20 p-4"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{document.name}</p>
                  {document.uploadedAt ? (
                    <p className="text-sm text-muted-foreground">{document.uploadedAt}</p>
                  ) : null}
                </div>
                {document.statusLabel ? (
                  <Badge variant={document.badgeVariant ?? 'secondary'}>{document.statusLabel}</Badge>
                ) : null}
              </li>
            ))}
          </ul>
        </OnboardingStatusSection>
      ) : null}

      <OnboardingStatusSection>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <MessageCircle className="h-8 w-8 shrink-0 text-primary" aria-hidden />
          <div className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">{nextTitle}</h2>
              <p className="text-sm text-muted-foreground">{nextDescription}</p>
            </div>
            {onContactSupport ? (
              <Button type="button" variant="outline" onClick={onContactSupport}>
                {contactSupportLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </OnboardingStatusSection>

      {lastUpdated ? <p className="text-center text-xs text-muted-foreground">{lastUpdated}</p> : null}
    </div>
  );
}
