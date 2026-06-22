import { cn } from '@/lib/utils';

export function OnboardingStatusSection({ title, children, className }) {
  return (
    <section className={cn('space-y-4 rounded-xl border bg-card p-6 text-card-foreground shadow-sm', className)}>
      {title ? <h2 className="text-base font-semibold tracking-tight">{title}</h2> : null}
      {children}
    </section>
  );
}
