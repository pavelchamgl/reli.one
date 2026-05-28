import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import solfIc from '../../../../assets/Seller/register/solfIc.svg';
import companyIc from '../../../../assets/Seller/register/companyBigIc.svg';
import { getOnboardingStatus, postSellerType } from '../../../../api/seller/onboarding';
import { ErrToast } from '../../../../ui/Toastify';
import { ONBOARDING_TOTAL_STEPS } from '@/features/seller-onboarding/constants/onboardingSteps';
import {
  SellerOnboardingLayout,
  SellerTypeContentView,
} from '@/components/seller/onboarding';

const SellerTypeContent = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('onbording');

  const [company, setCompany] = useState(null);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getOnboardingStatus()
      .then((res) => {
        setStatus(res.status);

        if (res?.status === 'pending_verification') {
          ErrToast(t('onboard.common.already_selected'));
        }
      })
      .catch((err) => {
        ErrToast(err.message);
      });
  }, [t]);

  const handleChooseSellerType = async () => {
    if (!company) return;
    if (status === 'pending_verification') return;

    setIsLoading(true);

    try {
      const res = await postSellerType(company);

      if (res.status === 200) {
        if (company === 'company') {
          navigate('/seller/seller-company');
        } else {
          navigate('/seller/seller-info');
        }
      }
    } catch (err) {
      if (err.status === 401) {
        ErrToast(t('onboard.common.auth_required'));
      }

      if (err.status === 403) {
        ErrToast(t('onboard.common.access_denied'));
      }

      ErrToast(err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SellerOnboardingLayout>
      <SellerTypeContentView
        title={t('onboard.selection.choose_type')}
        description={t('onboard.selection.select_option')}
        step={3}
        totalSteps={ONBOARDING_TOTAL_STEPS}
        stepLabel={t('reg.step_label')}
        selectedType={company}
        onSelectType={setCompany}
        onContinue={handleChooseSellerType}
        isContinueDisabled={!company || status === 'pending_verification'}
        isLoading={isLoading}
        selfEmployedTitle={t('onboard.selection.self_employed')}
        selfEmployedDesc={t('onboard.selection.self_employed_desc')}
        selfEmployedIcon={solfIc}
        companyTitle={t('onboard.selection.company_legal')}
        companyDesc={t('onboard.selection.company_legal_desc')}
        companyIcon={companyIc}
        continueLabel={t('onboard.common.continue')}
      />
    </SellerOnboardingLayout>
  );
};

export default SellerTypeContent;
