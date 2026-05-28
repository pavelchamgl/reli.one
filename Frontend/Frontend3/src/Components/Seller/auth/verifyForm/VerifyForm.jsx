import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import VerifyPinInput from '../verifyPinInput/VerifyPinInput';
import { emailPassConfirm, passSendOtp } from '../../../../api/auth';
import {
  SellerOnboardingLayout,
  VerifyFormView,
} from '@/components/seller/onboarding';

const VerifyForm = () => {
  const [time, setTime] = useState(59);
  const [value, setValue] = useState('');
  const [regErr, setRegErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { t } = useTranslation('onbording');
  const navigate = useNavigate();

  useEffect(() => {
    if (time > 0) {
      const interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [time]);

  const email = JSON.parse(localStorage.getItem('email') || 'null');

  const handleSendAgain = () => {
    passSendOtp({ email })
      .then(() => {
        setTime(59);
      })
      .catch(() => {
        setRegErr(t('auth.failedToSendOTP'));
      });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await emailPassConfirm({
        email,
        otp: value,
      });
      setRegErr('');
      localStorage.setItem('otp', JSON.stringify(value));
      navigate('/seller/create-password');
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      if (err.response) {
        if (err.response.status === 500) {
          setRegErr(t('auth.errorOccurredOnServer'));
        } else if (err.response.status === 400) {
          setRegErr(t('auth.otpExpiredOrInvalid'));
        } else if (err.response.status === 404) {
          setRegErr(t('auth.userWithEmailNotFound'));
        } else {
          setRegErr(t('auth.unknownErrorOccurred'));
        }
      } else {
        setRegErr(t('auth.failedToConnectToServer'));
      }
    }
  };

  return (
    <SellerOnboardingLayout>
      <VerifyFormView
        backLabel={t('auth.back')}
        onBack={() => navigate('/seller/reset')}
        title={t('auth.verify_email')}
        description={t('auth.code_sent')}
        email={email || 'seller@example.com'}
        enterCodeLabel={t('auth.enter_code')}
        pinInput={<VerifyPinInput value={value} setValue={setValue} />}
        regErr={regErr}
        isLoading={isLoading}
        isSubmitDisabled={value.length === 0}
        submitLabel={t('auth.confirm')}
        resendTimerLabel={t('auth.resendCodeIn')}
        resendSeconds={time}
        resendLabel={t('auth.resendCode')}
        onResend={handleSendAgain}
        didntReceiveLabel={t('auth.didntReceiveTheCode')}
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      />
    </SellerOnboardingLayout>
  );
};

export default VerifyForm;
