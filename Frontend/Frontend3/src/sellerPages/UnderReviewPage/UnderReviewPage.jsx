import { SellerOnboardingLayout } from '@/components/seller/onboarding';
import { UnderReviewStatusView } from '@/components/seller/onboarding/views/status';
import { underReviewStatusDefaults } from '@/features/seller-onboarding/statusPageDefaults';

const UnderReviewPage = () => {
  const navigate = useNavigate();

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
