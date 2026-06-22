import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/Components/ui/button';
import { onboardingUploadRowClassName } from '@/Components/Seller/onboarding/onboardingControlStyles';

const DEFAULT_HINT = 'Upload document (PDF, JPG, PNG - Max 10MB)';

/**
 * Presentational document upload row (Figma: compact horizontal control, h-48).
 * Container handles multipart API via onSelect.
 */
export function FileUploadZone({
  label,
  description,
  accept = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png',
  error,
  files = [],
  onSelect,
  disabled = false,
  selectLabel = 'Select file',
  required = false,
  className,
}) {
  const inputRef = useRef(null);
  const selectedName = files[0]?.name;
  const rowHint = selectedName || DEFAULT_HINT;

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    if (file && onSelect) {
      onSelect(file);
    }
    event.target.value = '';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label ? (
        <p className="text-sm font-medium leading-5">
          {label}
          {required ? (
            <span className="ml-0.5 text-destructive" aria-hidden="true">
              *
            </span>
          ) : null}
        </p>
      ) : null}
      {description ? (
        <p className="text-sm leading-5 text-muted-foreground">{description}</p>
      ) : null}
      <div
        className={cn(
          'flex w-full flex-col gap-2 rounded-md px-4 py-3 sm:h-12 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-0',
          onboardingUploadRowClassName,
          error && 'border-destructive',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span
          className={cn(
            'min-w-0 text-sm sm:flex-1 sm:truncate',
            selectedName ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {rowHint}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full shrink-0 sm:w-auto"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {selectLabel}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled}
          onChange={handleChange}
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
