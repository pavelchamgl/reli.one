import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Presentational document upload zone. Container handles multipart API.
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
  className,
}) {
  const inputRef = useRef(null);

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    if (file && onSelect) {
      onSelect(file);
    }
    event.target.value = '';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label ? <p className="text-sm font-medium">{label}</p> : null}
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div
        className={cn(
          'rounded-lg border border-dashed border-input bg-muted/30 p-6 text-center',
          error && 'border-destructive',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
        <Button
          type="button"
          variant="outline"
          size="sm"
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
      {files.length > 0 ? (
        <ul className="space-y-1 text-sm">
          {files.map((file) => (
            <li key={file.id ?? file.name} className="text-foreground">
              {file.name}
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
