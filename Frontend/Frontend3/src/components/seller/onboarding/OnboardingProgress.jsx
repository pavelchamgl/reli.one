import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ONBOARDING_STEP_ORDER,
  isValidOnboardingStepKey,
} from '@/features/seller-onboarding/constants/onboardingSteps';

/**
 * Read-only visual progress from backend `next_step` / completeness.
 * Does not navigate — containers keep existing routing.
 */
export function OnboardingProgress({
  currentStepKey,
  completedSteps = [],
  stepLabels = {},
  ariaLabel = 'Onboarding progress',
  className,
}) {
  const completedSet = new Set(completedSteps);

  return (
    <nav aria-label={ariaLabel} className={cn('w-full', className)}>
      <ol className="flex flex-wrap gap-2">
        {ONBOARDING_STEP_ORDER.map((stepKey) => {
          const isCurrent =
            isValidOnboardingStepKey(currentStepKey) &&
            stepKey === currentStepKey;
          const isCompleted = completedSet.has(stepKey);
          const label = stepLabels[stepKey] ?? stepKey;

          return (
            <li key={stepKey}>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
                  isCurrent &&
                    'border-primary bg-primary/10 text-primary',
                  isCompleted &&
                    !isCurrent &&
                    'border-border bg-muted text-muted-foreground',
                  !isCurrent &&
                    !isCompleted &&
                    'border-border bg-background text-muted-foreground'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3 shrink-0" aria-hidden />
                ) : null}
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
