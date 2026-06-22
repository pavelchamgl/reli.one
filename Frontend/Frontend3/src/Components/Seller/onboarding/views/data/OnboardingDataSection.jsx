import { cn } from '@/lib/utils';
import { onboardingSectionCardClassName } from '@/Components/Seller/onboarding/onboardingControlStyles';

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
      className={cn(onboardingSectionCardClassName, 'space-y-5', className)}
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
      <div className="flex h-10 items-center gap-3">
        {iconSrc ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <img src={iconSrc} alt="" className="h-6 w-6 object-contain" />
          </span>
        ) : null}
        <h2 className="text-base font-semibold leading-5 tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
