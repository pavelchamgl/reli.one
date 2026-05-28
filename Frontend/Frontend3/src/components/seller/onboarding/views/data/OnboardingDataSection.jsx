import { cn } from '@/lib/utils';

export function OnboardingDataSection({
  iconSrc,
  title,
  children,
  sectionRef,
  onSectionBlur,
  ignoreBlurRef,
  className,
}) {
  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      className={cn(
        'space-y-4 rounded-xl border bg-card p-6 text-card-foreground shadow-sm',
        className
      )}
      onBlurCapture={(event) => {
        if (ignoreBlurRef?.current) {
          ignoreBlurRef.current = false;
          return;
        }
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setTimeout(onSectionBlur, 0);
        }
      }}
    >
      <div className="flex items-center gap-3">
        {iconSrc ? <img src={iconSrc} alt="" className="h-8 w-8 shrink-0 object-contain" /> : null}
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
