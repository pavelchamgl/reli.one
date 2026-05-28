import { describe, it, expect } from 'vitest';
import {
  ONBOARDING_STEP_ORDER,
  ONBOARDING_TOTAL_STEPS,
  getOnboardingStepIndex,
  getOnboardingStepNumber,
  getOnboardingStepsBefore,
  isValidOnboardingStepKey,
} from './onboardingSteps';

describe('onboardingSteps', () => {
  it('matches backend compute_next_step order', () => {
    expect(ONBOARDING_STEP_ORDER).toEqual([
      'seller_type',
      'personal',
      'tax',
      'address',
      'bank',
      'warehouse',
      'return',
      'documents',
      'review',
    ]);
    expect(ONBOARDING_TOTAL_STEPS).toBe(9);
  });

  it('resolves step index and number', () => {
    expect(getOnboardingStepIndex('bank')).toBe(4);
    expect(getOnboardingStepNumber('bank')).toBe(5);
    expect(getOnboardingStepIndex('unknown')).toBeNull();
    expect(getOnboardingStepNumber('unknown')).toBeNull();
  });

  it('returns steps before current key', () => {
    expect(getOnboardingStepsBefore('tax')).toEqual([
      'seller_type',
      'personal',
    ]);
    expect(getOnboardingStepsBefore('seller_type')).toEqual([]);
  });

  it('validates step keys', () => {
    expect(isValidOnboardingStepKey('review')).toBe(true);
    expect(isValidOnboardingStepKey('submitted')).toBe(false);
  });
});
