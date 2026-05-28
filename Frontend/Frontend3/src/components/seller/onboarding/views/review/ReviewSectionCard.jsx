import { FileText, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ReviewSectionCard({
  iconSrc,
  title,
  rows = [],
  blocks,
  documents = [],
  onEdit,
  editLabel = 'Edit',
  className,
}) {
  return (
    <section
      className={cn(
        'space-y-4 rounded-xl border bg-card p-6 text-card-foreground shadow-sm',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {iconSrc ? (
            <img src={iconSrc} alt="" className="h-8 w-8 shrink-0 object-contain" />
          ) : null}
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        </div>
        {onEdit ? (
          <Button type="button" variant="outline" size="sm" onClick={onEdit} className="shrink-0">
            <Pencil className="mr-2 h-4 w-4" aria-hidden />
            {editLabel}
          </Button>
        ) : null}
      </div>

      {rows.length > 0 ? (
        <dl className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ label, value, mono }) => (
            <div key={label} className="space-y-1">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className={cn('text-sm font-medium', mono && 'font-mono tabular-nums')}>
                {value || '—'}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {blocks?.map((block, index) => (
        <div key={block.title ?? index} className="space-y-2">
          {index > 0 ? <hr className="border-border" /> : null}
          {block.title ? <p className="text-sm font-medium">{block.title}</p> : null}
          {block.lines?.map((line) => (
            <p
              key={line}
              className={cn('text-sm text-muted-foreground', block.mono && 'font-mono tabular-nums')}
            >
              {line}
            </p>
          ))}
        </div>
      ))}

      {documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map(({ label, fileName, onClick }) => (
            <div key={label ?? fileName} className="space-y-2">
              {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
              <button
                type="button"
                onClick={onClick ?? onEdit}
                className="flex w-full items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-left text-sm hover:bg-muted/50"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="truncate">{fileName}</span>
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
