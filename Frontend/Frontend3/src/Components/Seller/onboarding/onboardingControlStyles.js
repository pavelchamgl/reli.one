/** Shared control sizing for seller onboarding forms (Figma: 48px height). */
export const onboardingControlClassName = 'h-12 text-base md:text-sm';

/** Section cards — softer shadow/radius per PDF (not generic shadcn drop shadow). */
export const onboardingSectionCardClassName =
  'rounded-xl border border-solid border-[#E5E7EB] bg-card p-4 text-card-foreground shadow-[0_4px_24px_-4px_rgba(15,23,42,0.12)] sm:p-8';

/** Upload row border — explicit solid border (preflight disabled in tailwind.config). */
export const onboardingUploadRowClassName =
  'border border-solid border-[#D1D5DB] bg-background';
