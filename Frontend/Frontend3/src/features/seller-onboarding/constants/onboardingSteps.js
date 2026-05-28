/**
 * Backend `next_step` order (compute_next_step in services_onboarding.py).
 * Display labels come from i18n via props — not hardcoded here.
 */
export const ONBOARDING_STEP_ORDER = [
  'seller_type',
  'personal',
  'tax',
  'address',
  'bank',
  'warehouse',
  'return',
  'documents',
  'review',
];

export const ONBOARDING_TOTAL_STEPS = ONBOARDING_STEP_ORDER.length;

/** Suggested i18n keys under namespace `onbording` (add when wiring FE-018+). */
export const ONBOARDING_STEP_I18N_KEYS = {
  seller_type: 'onboard.steps.seller_type',
  personal: 'onboard.steps.personal',
  tax: 'onboard.steps.tax',
  address: 'onboard.steps.address',
  bank: 'onboard.steps.bank',
  warehouse: 'onboard.steps.warehouse',
  return: 'onboard.steps.return',
  documents: 'onboard.steps.documents',
  review: 'onboard.steps.review',
};

export function isValidOnboardingStepKey(stepKey) {
  return ONBOARDING_STEP_ORDER.includes(stepKey);
}

/** Zero-based index, or null if unknown. */
export function getOnboardingStepIndex(stepKey) {
  const index = ONBOARDING_STEP_ORDER.indexOf(stepKey);
  return index === -1 ? null : index;
}

/** One-based step number for UI, or null if unknown. */
export function getOnboardingStepNumber(stepKey) {
  const index = getOnboardingStepIndex(stepKey);
  return index === null ? null : index + 1;
}

/** Steps strictly before currentKey in backend order. */
export function getOnboardingStepsBefore(stepKey) {
  const index = getOnboardingStepIndex(stepKey);
  if (index === null || index <= 0) {
    return [];
  }
  return ONBOARDING_STEP_ORDER.slice(0, index);
}
