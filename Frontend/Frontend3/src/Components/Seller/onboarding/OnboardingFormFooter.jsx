import { cn } from '@/lib/utils';
import { Button } from '@/Components/ui/button';

export function OnboardingFormFooter({
  onBack,
  onContinue,
  backLabel = 'Back',
  continueLabel = 'Continue',
  isSubmitting = false,
  continueDisabled = false,
  showBack = Boolean(onBack),
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center',
        showBack ? 'sm:justify-between' : 'sm:justify-end',
        className
      )}
    >
      {showBack ? (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
        >
          {backLabel}
        </Button>
      ) : null}
      <Button
        type="button"
        onClick={onContinue}
        disabled={continueDisabled || isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? `${continueLabel}…` : continueLabel}
      </Button>
    </div>
  );
}
