const ONBOARDING_DATA_STEPS = [
  'personal',
  'tax',
  'address',
  'bank',
  'warehouse',
  'return',
  'documents',
];

export function resolveOnboardingDataStepPath({ nextStep, sellerType }) {
  if (ONBOARDING_DATA_STEPS.includes(nextStep)) {
    return sellerType === 'company' ? '/seller/seller-company' : '/seller/seller-info';
  }

  if (nextStep === 'seller_type') {
    return '/seller/seller-type';
  }

  if (nextStep === 'review') {
    return sellerType === 'company' ? '/seller/seller-review-company' : '/seller/seller-review';
  }

  return null;
}

export function resolveOnboardingStatusRedirect(status) {
  if (!status) return null;

  if (status.status === 'rejected' || (status.requires_onboarding && status.is_editable)) {
    return resolveOnboardingDataStepPath({
      nextStep: status.next_step,
      sellerType: status.seller_type,
    });
  }

  if (status.requires_onboarding === false) {
    return '/seller/goods-choice';
  }

  if (status.requires_onboarding === true && status.is_editable === false) {
    return '/seller/application-sub';
  }

  return null;
}
