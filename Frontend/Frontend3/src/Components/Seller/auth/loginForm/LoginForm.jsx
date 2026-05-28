import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { login } from '../../../../api/auth';
import { syncBasket } from '../../../../redux/basketSlice';
import { setToken } from '../../../../redux/authSlice';
import { getOnboardingStatus } from '../../../../api/seller/onboarding';
import {
  SellerOnboardingLayout,
  LoginFormView,
} from '@/components/seller/onboarding';

const LoginForm = () => {
  const [regErr, setRegErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t: tOnb } = useTranslation('onbording');

  const validationLogin = Yup.object().shape({
    email: Yup.string()
      .email(t('validation.email.email'))
      .required(t('validation.email.required')),
    password: Yup.string()
      .test('password', t('validation.password.passwordCriteria'), (value) =>
        /[a-z]/.test(value) &&
        /[A-Z]/.test(value) &&
        /\d/.test(value) &&
        /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)
      )
      .min(8, t('validation.password.minLength'))
      .max(20, t('validation.password.maxLength'))
      .required(t('validation.password.required')),
  });

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: validationLogin,
    onSubmit: async (values) => {
      setIsLoading(true);

      try {
        const res = await login(values);
        localStorage.setItem('token', JSON.stringify(res.data));
        localStorage.setItem('email', JSON.stringify(values.email));
        dispatch(setToken(res.data));
        dispatch(syncBasket());
        setIsLoading(false);

        const res2 = await getOnboardingStatus();

        if (res2 && res2?.requires_onboarding === false) {
          navigate('/seller/goods-choice');
        }

        if (res2 && res2?.requires_onboarding === true && res2?.is_editable === false) {
          navigate('/seller/application-sub');
        }

        if (res2 && res2.requires_onboarding === true && res2?.is_editable === true) {
          const onboardRoutes = ['personal', 'tax', 'address', 'bank', 'warehouse', 'return', 'documents'];
          const nextStep = res2?.next_step;
          const sellerType = res2?.seller_type;
          if (onboardRoutes.includes(nextStep)) {
            if (sellerType === 'company') {
              navigate('/seller/seller-company');
            } else {
              navigate('/seller/seller-info');
            }
          }
          if (nextStep === 'seller_type') {
            navigate('/seller/seller-type');
          }
          if (nextStep === 'review') {
            if (sellerType === 'company') {
              navigate('/seller/seller-review-company');
            } else {
              navigate('/seller/seller-review');
            }
          }
        }
      } catch (err) {
        setIsLoading(false);
        if (err.response) {
          if (err.response.status === 500) {
            setRegErr(tOnb('auth.errorOccurredOnServer'));
          } else if (err.response.status === 401) {
            const errorData = err.response.data;
            let errorMessage = '';

            for (const key in errorData) {
              if (Array.isArray(errorData[key])) {
                errorMessage += `${key}: ${errorData[key].join(', ')} `;
              }
            }

            setRegErr(errorMessage.trim() || tOnb('auth.noActiveAccountFound'));
          } else {
            setRegErr(tOnb('auth.unknownErrorOccurred'));
          }
        } else {
          setRegErr(tOnb('auth.failedToConnectToServer'));
        }
      }
    },
  });

  return (
    <SellerOnboardingLayout>
      <LoginFormView
        title={tOnb('auth.login_title')}
        description={tOnb('auth.login_subtitle')}
        emailLabel={t('email')}
        passwordLabel={t('password')}
        emailPlaceholder="your.email@reli.one"
        passwordPlaceholder={tOnb('auth.placeholder_password')}
        values={formik.values}
        errors={formik.errors}
        regErr={regErr}
        isLoading={isLoading}
        isSubmitDisabled={!formik.isValid || !formik.dirty}
        submitLabel={tOnb('auth.login')}
        forgotPasswordLabel={tOnb('auth.forgot_password')}
        onForgotPasswordClick={() => navigate('/seller/reset')}
        noAccountLabel={tOnb('auth.no_account')}
        signUpLabel={tOnb('auth.signUp')}
        onSignUpClick={() => navigate('/seller/create-account')}
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

export default LoginForm;
