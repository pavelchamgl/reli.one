import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getOnboardingStatus } from '../../api/seller/onboarding';
import { SellerOnboardingLayout } from '@/components/seller/onboarding';
import { FinishVerificationStatusView } from '@/components/seller/onboarding/views/status';
import { resolveOnboardingDataStepPath } from '@/features/seller-onboarding/resolveOnboardingRoute';
import {
  countCompletedOnboardingSteps,
  finishVerificationStatusDefaults,
} from '@/features/seller-onboarding/statusPageDefaults';

const FinishVerificationPage = () => {
  const navigate = useNavigate();
  const [onboardingStatus, setOnboardingStatus] = useState(null);

  useEffect(() => {
    getOnboardingStatus().then(setOnboardingStatus);
  }, []);

  const continuePath = useMemo(
    () =>
      resolveOnboardingDataStepPath({
        nextStep: onboardingStatus?.next_step,
        sellerType: onboardingStatus?.seller_type,
      }),
    [onboardingStatus]
  );

  const handleContinue = useCallback(() => {
    if (continuePath) {
      navigate(continuePath);
    }
  }, [continuePath, navigate]);

  const completedSteps = onboardingStatus?.completeness
    ? countCompletedOnboardingSteps(onboardingStatus.completeness)
    : finishVerificationStatusDefaults.completedSteps;

  const totalSteps = finishVerificationStatusDefaults.totalSteps;

  const steps = finishVerificationStatusDefaults.steps.map((step) =>
    step.actionLabel
      ? {
          ...step,
          onAction: handleContinue,
        }
      : step
  );

  const documents = finishVerificationStatusDefaults.documents.map((document) => ({
    ...document,
    onAction: handleContinue,
  }));

  return (
    <SellerOnboardingLayout contentClassName="max-w-3xl">
      <FinishVerificationStatusView
        {...finishVerificationStatusDefaults}
        completedSteps={completedSteps}
        progressLabel={`${completedSteps} of ${totalSteps} steps completed`}
        steps={steps}
        documents={documents}
        onPrimaryAction={handleContinue}
        isPrimaryActionDisabled={!continuePath}
      />
    </SellerOnboardingLayout>
  );
};

export default FinishVerificationPage;
