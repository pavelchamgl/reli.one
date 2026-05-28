import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { passSendOtp } from '../../../../api/auth';
import {
  SellerOnboardingLayout,
  ResetFormView,
} from '@/components/seller/onboarding';

const ResetForm = () => {
  const { t } = useTranslation();
  const { t: tOnb } = useTranslation('onbording');
  const [regErr, setRegErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const validationReset = Yup.object().shape({
    email: Yup.string()
      .email(t('validation.email.email'))
      .required(t('validation.email.required')),
  });

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: validationReset,
    onSubmit: (values) => {
      setIsLoading(true);
      passSendOtp(values)
        .then(() => {
          localStorage.setItem('email', JSON.stringify(values.email));
          navigate('/seller/verify-email');
          setIsLoading(false);
        })
        .catch((err) => {
          setIsLoading(false);
          if (err.response) {
            if (err.response.status === 500) {
              setRegErr(tOnb('auth.errorOccurredOnServer'));
            } else if (err.response.status === 400) {
              const errorData = err.response.data;
              let errorMessage = '';

              for (const key in errorData) {
                if (errorData[key] && Array.isArray(errorData[key])) {
                  errorMessage += `${key}: ${errorData[key].join(', ')} `;
                }
              }

              setRegErr(errorMessage.trim() || tOnb('auth.noActiveAccountFound'));
            } else if (err.response.status === 404) {
              setRegErr(tOnb('auth.userWithEmailNotFound'));
            } else {
              setRegErr(tOnb('auth.unknownErrorOccurred'));
            }
          } else {
            setRegErr(tOnb('auth.failedToConnectToServer'));
          }
        });
    },
  });

  return (
    <SellerOnboardingLayout>
      <ResetFormView
        backLabel={tOnb('auth.backToLogin')}
        onBack={() => navigate('/seller/login')}
        title={tOnb('auth.resetYourPassword')}
        description={tOnb('auth.enterTheEmailAddress')}
        emailLabel={t('email')}
        emailPlaceholder="your.email@reli.one"
        values={formik.values}
        errors={formik.errors}
        regErr={regErr}
        isLoading={isLoading}
        isSubmitDisabled={!formik.isValid || !formik.dirty}
        submitLabel={tOnb('auth.sendCode')}
        rememberPasswordLabel={tOnb('auth.rememberYourPassword')}
        loginInsteadLabel={tOnb('auth.logInInstead')}
        onLoginClick={() => navigate('/seller/login')}
        onFieldChange={formik.handleChange}
        onFieldBlur={formik.handleBlur}
        onSubmit={(event) => {
          event.preventDefault();
          formik.handleSubmit();
        }}
      />
    </SellerOnboardingLayout>
  );
};

export default ResetForm;
