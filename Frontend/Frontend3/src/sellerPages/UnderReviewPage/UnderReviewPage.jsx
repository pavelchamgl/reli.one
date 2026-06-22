import { SellerOnboardingLayout } from '@/Components/Seller/onboarding';
import { UnderReviewStatusView } from '@/Components/Seller/onboarding/views/status';
import { underReviewStatusDefaults } from '@/features/seller-onboarding/statusPageDefaults';

const UnderReviewPage = () => {
  const handleContactSupport = () => {
    window.open('https://info.reli.one/#contact', '_blank', 'noopener,noreferrer');
  };

  return (
    <SellerOnboardingLayout contentClassName="max-w-3xl">
      <UnderReviewStatusView
        {...underReviewStatusDefaults}
        onContactSupport={handleContactSupport}
      />
    </SellerOnboardingLayout>
  );
};

export default UnderReviewPage;
