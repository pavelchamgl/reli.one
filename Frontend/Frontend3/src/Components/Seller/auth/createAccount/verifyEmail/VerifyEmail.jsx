import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { setToken } from '../../../../../redux/authSlice';
import VerifyPinInput from '../../verifyPinInput/VerifyPinInput';
import { emailConfirm, sendOtp } from '../../../../../api/auth';
import { ONBOARDING_TOTAL_STEPS } from '@/features/seller-onboarding/constants/onboardingSteps';
import {
  SellerOnboardingLayout,
  CreateVerifyEmailView,
} from '@/components/seller/onboarding';

const VeriFyEmail = () => {
  const [value, setValue] = useState('');
  const [regErr, setRegErr] = useState('');
  const [time, setTime] = useState(59);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t: tOnb } = useTranslation('onbording');

  useEffect(() => {
    if (time > 0) {
      const interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [time]);

  const email = JSON.parse(localStorage.getItem('email') || 'null');

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await emailConfirm({
        email,
        otp: value,
      });
      setRegErr('');
      localStorage.setItem('token', JSON.stringify(res.data));
      dispatch(setToken(res.data));
      navigate('/seller/seller-type');
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      if (err.response) {
        if (err.response.status === 500) {
          setRegErr(tOnb('auth.errorOccurredOnServer'));
        } else if (err.response.status === 400) {
          setRegErr(tOnb('auth.otpExpiredOrInvalid'));
        } else if (err.response.status === 404) {
          setRegErr(tOnb('auth.userWithEmailNotFound'));
        } else {
          setRegErr(tOnb('auth.unknownErrorOccurred'));
        }
      } else {
        setRegErr(tOnb('auth.failedToConnectToServer'));
      }
    }
  };

  const handleSendAgain = () => {
    sendOtp({ email })
      .then(() => {
        setTime(59);
      })
      .catch(() => {
        setRegErr(tOnb('auth.failedToSendOTP'));
      });
  };

  return (
    <SellerOnboardingLayout>
      <CreateVerifyEmailView
        title={tOnb('onboard.verification.verify_email')}
        description={tOnb('onboard.verification.code_sent')}
        email={email || '1@gmail.com'}
        step={2}
        totalSteps={ONBOARDING_TOTAL_STEPS}
        stepLabel={tOnb('reg.step_label')}
        pinInput={<VerifyPinInput setValue={setValue} value={value} />}
        regErr={regErr}
        isLoading={isLoading}
        isSubmitDisabled={value.length === 0}
        submitLabel={tOnb('onboard.common.confirm')}
        resendTimerLabel={tOnb('onboard.verification.resend_code')}
        resendSeconds={time}
        resendLabel={tOnb('auth.resendCode')}
        onResend={handleSendAgain}
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      />
    </SellerOnboardingLayout>
  );
};

export default VeriFyEmail;
