import { describe, it, expect } from 'vitest';

import {
  resolveOnboardingDataStepPath,
  resolveOnboardingStatusRedirect,
} from './resolveOnboardingRoute';

describe('resolveOnboardingRoute', () => {
  it('maps data steps to seller onboarding routes', () => {
    expect(
      resolveOnboardingDataStepPath({ nextStep: 'bank', sellerType: 'self_employed' })
    ).toBe('/seller/seller-info');
    expect(resolveOnboardingDataStepPath({ nextStep: 'review', sellerType: 'company' })).toBe(
      '/seller/seller-review-company'
    );
  });

  it('redirects approved sellers to goods choice', () => {
    expect(
      resolveOnboardingStatusRedirect({
        requires_onboarding: false,
      })
    ).toBe('/seller/goods-choice');
  });
});
