import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';

/** API / form-level error banner for onboarding screens. */
export function OnboardingAlert({ title, message, className }) {
  if (!title && !message) {
    return null;
  }

  return (
    <Alert variant="destructive" className={cn(className)}>
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      {message ? <AlertDescription>{message}</AlertDescription> : null}
    </Alert>
  );
}
