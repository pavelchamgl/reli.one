import { useFormik } from 'formik';
import * as yup from 'yup';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { createNewPassApi } from '../../../../api/auth';
import {
  SellerOnboardingLayout,
  CreatePassFormView,
} from '@/components/seller/onboarding';

const CreatePassForm = () => {
  const { t } = useTranslation();
  const { t: tOnb } = useTranslation('onbording');
  const [regErr, setRegErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const validationPassword = yup.object().shape({
    password: yup
      .string()
      .test('password', t('validation.password.passwordCriteria'), (value) =>
        /[a-z]/.test(value) &&
        /[A-Z]/.test(value) &&
        /\d/.test(value) &&
        /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)
      )
      .min(8, t('validation.password.minLength'))
      .max(20, t('validation.password.maxLength'))
      .required(t('validation.password.required')),
    confirm_password: yup
      .string()
      .oneOf([yup.ref('password'), null], t('validation.confirmPassword.oneOf'))
      .required(t('validation.confirmPassword.required')),
  });

  const email = localStorage.getItem('email') ? JSON.parse(localStorage.getItem('email')) : '';
  const otp = localStorage.getItem('otp') ? JSON.parse(localStorage.getItem('otp')) : '';

  const formik = useFormik({
    initialValues: {
      password: '',
      confirm_password: '',
    },
    validationSchema: validationPassword,
    onSubmit: (values) => {
      setIsLoading(true);
      createNewPassApi({
        password: values.password,
        confirm_password: values.confirm_password,
        email,
        otp,
      })
        .then(() => {
          localStorage.removeItem('email');
          localStorage.removeItem('otp');
          navigate('/seller/successfully-reset');
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

              setRegErr(errorMessage.trim() || tOnb('auth.otpExpiredOrInvalid'));
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

  const { password } = formik.values;

  const requirements = [
    {
      label: tOnb('auth.req_length'),
      met: password.length > 8,
    },
    {
      label: tOnb('auth.req_uppercase'),
      met: password.match(/[A-ZА-Я]/g)?.length > 0,
    },
    {
      label: tOnb('auth.req_digit'),
      met: password.match(/\d/g)?.length > 0,
    },
    {
      label: tOnb('auth.req_special'),
      met: password.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/g)?.length > 0,
    },
  ];

  return (
    <SellerOnboardingLayout>
      <CreatePassFormView
        title={tOnb('auth.title')}
        description={tOnb('auth.description')}
        passwordLabel={tOnb('auth.label_password')}
        passwordPlaceholder={tOnb('auth.placeholder_password')}
        confirmPasswordLabel={tOnb('auth.label_confirm_password')}
        confirmPasswordPlaceholder={tOnb('auth.placeholder_confirm_password')}
        values={formik.values}
        errors={formik.errors}
        regErr={regErr}
        isLoading={isLoading}
        isSubmitDisabled={!formik.isValid || !formik.dirty}
        submitLabel={tOnb('auth.button_save')}
        requirementsTitle={tOnb('auth.requirements_title')}
        requirements={requirements}
        footerNote={tOnb('auth.footer_note')}
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

export default CreatePassForm;
