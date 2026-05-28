import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export function FormField({
  id,
  label,
  error,
  hint,
  required = false,
  children,
  className,
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {label ? (
        <Label htmlFor={id}>
          {label}
          {required ? (
            <span className="ml-0.5 text-destructive" aria-hidden="true">
              *
            </span>
          ) : null}
        </Label>
      ) : null}
      {children}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
      {!error && hint ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
