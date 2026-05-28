import { cn } from '@/lib/utils';

export function OnboardingStepHeader({
  title,
  description,
  step,
  totalSteps,
  stepLabel,
  className,
}) {
  const showStepIndicator =
    typeof step === 'number' &&
    typeof totalSteps === 'number' &&
    totalSteps > 0;

  return (
    <header className={cn('space-y-2', className)}>
      {showStepIndicator ? (
        <p className="text-sm text-muted-foreground">
          {stepLabel ?? 'Step'}{' '}
          <span className="font-medium text-foreground">{step}</span>{' '}
          <span className="text-muted-foreground">/</span>{' '}
          <span className="font-medium text-foreground">{totalSteps}</span>
        </p>
      ) : null}
      {title ? (
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      ) : null}
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}
