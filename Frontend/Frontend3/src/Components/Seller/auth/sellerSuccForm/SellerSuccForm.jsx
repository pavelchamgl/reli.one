import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  SellerOnboardingLayout,
  SellerSuccessfullyResetView,
} from '@/components/seller/onboarding';

const SellerSuccForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('onbording');

  return (
    <SellerOnboardingLayout>
      <SellerSuccessfullyResetView
        title={t('auth.password_reset_success')}
        description={`${t('auth.password_reset_success_alt')} ${t('auth.login_with_new_password')}`}
        submitLabel={t('auth.login')}
        onSubmit={() => navigate('/seller/login')}
        securityTipTitle={t('auth.security_tip_title')}
        securityTipText={t('auth.security_tip_text')}
      />
    </SellerOnboardingLayout>
  );
};

export default SellerSuccForm;
