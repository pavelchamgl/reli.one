import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getOnboardingStatus } from '../../api/seller/onboarding';
import { SellerOnboardingLayout } from '@/Components/Seller/onboarding';
import { ActionRequiredStatusView } from '@/Components/Seller/onboarding/views/status';
import { resolveOnboardingDataStepPath } from '@/features/seller-onboarding/resolveOnboardingRoute';
import { actionRequiredStatusDefaults } from '@/features/seller-onboarding/statusPageDefaults';

const ActionRequiredPage = () => {
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

  const steps = actionRequiredStatusDefaults.steps.map((step) =>
    step.actionLabel
      ? {
          ...step,
          onAction: handleContinue,
        }
      : step
  );

  const documents = actionRequiredStatusDefaults.documents.map((document) => ({
    ...document,
    onAction: handleContinue,
  }));

  return (
    <SellerOnboardingLayout contentClassName="max-w-3xl">
      <ActionRequiredStatusView
        {...actionRequiredStatusDefaults}
        steps={steps}
        documents={documents}
        onPrimaryAction={handleContinue}
      />
    </SellerOnboardingLayout>
  );
};

export default ActionRequiredPage;
