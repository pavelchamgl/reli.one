import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/Components/ui/input';
import {
  SellerOnboardingLayout,
  SellerOnboardingCard,
  OnboardingStepHeader,
  OnboardingFormFooter,
  OnboardingAlert,
  FormField,
  OnboardingProgress,
} from './index';

describe('Seller onboarding layout shell (FE-017)', () => {
  it('renders layout title, footer actions, and API error banner', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const onContinue = vi.fn();

    render(
      <SellerOnboardingLayout>
        <OnboardingProgress
          currentStepKey="personal"
          completedSteps={['seller_type']}
          stepLabels={{ seller_type: 'Type', personal: 'Personal' }}
        />
        <SellerOnboardingCard>
          <OnboardingStepHeader
            title="Personal details"
            description="Tell us about yourself"
            step={2}
            totalSteps={9}
            stepLabel="Step"
          />
          <OnboardingAlert message="Invalid tax ID" />
          <FormField id="email" label="Email" error="Required field">
            <Input id="email" name="email" />
          </FormField>
          <OnboardingFormFooter
            onBack={onBack}
            onContinue={onContinue}
            backLabel="Back"
            continueLabel="Continue"
          />
        </SellerOnboardingCard>
      </SellerOnboardingLayout>
    );

    expect(screen.getByRole('heading', { name: 'Personal details' })).toBeInTheDocument();
    expect(screen.getByText('Tell us about yourself')).toBeInTheDocument();
    expect(screen.getByText('Invalid tax ID')).toBeInTheDocument();
    expect(screen.getByText('Required field')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Onboarding progress' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('disables continue while submitting', () => {
    render(
      <OnboardingFormFooter
        onContinue={vi.fn()}
        continueLabel="Save"
        isSubmitting
      />
    );

    expect(screen.getByRole('button', { name: 'Save…' })).toBeDisabled();
  });
});
