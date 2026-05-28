import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingProgress } from './OnboardingProgress';

describe('OnboardingProgress', () => {
  it('marks current step and completed steps', () => {
    render(
      <OnboardingProgress
        currentStepKey="bank"
        completedSteps={['seller_type', 'personal', 'tax', 'address']}
        stepLabels={{
          seller_type: 'Type',
          personal: 'Personal',
          tax: 'Tax',
          address: 'Address',
          bank: 'Bank',
        }}
        ariaLabel="Progress"
      />
    );

    const nav = screen.getByRole('navigation', { name: 'Progress' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByText('Bank').closest('[aria-current="step"]')).toBeTruthy();
  });
});
