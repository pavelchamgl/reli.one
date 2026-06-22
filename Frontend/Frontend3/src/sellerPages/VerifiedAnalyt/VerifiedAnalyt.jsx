import { useNavigate } from 'react-router-dom';

import { SellerOnboardingLayout } from '@/Components/Seller/onboarding';
import { VerifiedSellerStatusView } from '@/Components/Seller/onboarding/views/status';
import { verifiedSellerStatusDefaults } from '@/features/seller-onboarding/statusPageDefaults';

const VerifiedAnalyt = () => {
  const navigate = useNavigate();

  const nextSteps = verifiedSellerStatusDefaults.nextSteps.map((step) => {
    if (step.id === 'dashboard') {
      return {
        ...step,
        onAction: () => navigate('/seller/goods-choice'),
      };
    }

    return step;
  });

  return (
    <SellerOnboardingLayout contentClassName="max-w-3xl">
      <VerifiedSellerStatusView {...verifiedSellerStatusDefaults} nextSteps={nextSteps} />
    </SellerOnboardingLayout>
  );
};

export default VerifiedAnalyt;
