import { useFormik } from 'formik';
import * as yup from 'yup';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { registerSeller } from '../../../../../api/seller/auth';
import { useActionSafeEmploed } from '../../../../../hook/useActionSafeEmploed';
import { ONBOARDING_TOTAL_STEPS } from '@/features/seller-onboarding/constants/onboardingSteps';
import {
  SellerOnboardingLayout,
  CreateAccountFormView,
} from '@/components/seller/onboarding';

const CreateForm = () => {
  const { t } = useTranslation();
  const { t: tOnb } = useTranslation('onbording');

  const [isAgree, setIsAgree] = useState(false);
  const [regErr, setRegErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { setRegisterData } = useActionSafeEmploed();

  const validationSchema = yup.object().shape({
    first_name: yup.string().required(t('validation.name.required')),
    last_name: yup.string().required(t('validation.name.required')),
    email: yup
      .string()
      .typeError(t('validation.email.typeError'))
      .email(t('validation.email.email'))
      .required(t('validation.email.required')),
    phone_number: yup
      .string()
      .transform((value) => value?.replace(/\D/g, '') || '')
      .matches(/^\d{10,15}$/, t('validation.phone_number.invalid'))
      .required(t('validation.phone_number.required')),
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

  const formik = useFormik({
    initialValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      password: '',
      confirm_password: '',
    },
    validationSchema,
    onSubmit: (values) => {
      setIsLoading(true);

      registerSeller(values)
        .then(() => {
          setRegErr('');
          localStorage.setItem('email', JSON.stringify(values.email));
          localStorage.setItem('first_name', JSON.stringify(values.first_name));
          localStorage.setItem('last_name', JSON.stringify(values.last_name));
          localStorage.setItem('phone_number', JSON.stringify(values.phone_number));
          setRegisterData({ ...values });
          setIsLoading(false);
          navigate('/seller/create-verify');
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

              setRegErr(errorMessage.trim() || tOnb('reg.error_conflict'));
            } else {
              setRegErr(tOnb('auth.unknownErrorOccurred'));
            }
          } else {
            setRegErr(tOnb('auth.failedToConnectToServer'));
          }
        });
    },
  });

  const fields = [
    {
      name: 'first_name',
      type: 'text',
      label: tOnb('reg.label_first_name'),
      placeholder: tOnb('reg.placeholder_first_name'),
    },
    {
      name: 'last_name',
      type: 'text',
      label: tOnb('reg.label_last_name'),
      placeholder: tOnb('reg.placeholder_last_name'),
    },
    {
      name: 'email',
      type: 'email',
      label: tOnb('reg.label_email'),
      placeholder: tOnb('reg.placeholder_email'),
    },
    {
      name: 'phone_number',
      type: 'tel',
      label: tOnb('reg.label_phone'),
      placeholder: tOnb('reg.placeholder_phone'),
    },
    {
      name: 'password',
      type: 'password',
      label: tOnb('reg.label_password'),
      placeholder: tOnb('reg.placeholder_password'),
    },
    {
      name: 'confirm_password',
      type: 'password',
      label: tOnb('reg.label_confirm_password'),
      placeholder: tOnb('reg.placeholder_confirm_password'),
    },
  ];

  return (
    <SellerOnboardingLayout>
      <CreateAccountFormView
        title={tOnb('reg.title')}
        description={tOnb('reg.description')}
        step={1}
        totalSteps={ONBOARDING_TOTAL_STEPS}
        stepLabel={tOnb('reg.step_label')}
        fields={fields}
        values={formik.values}
        errors={formik.errors}
        regErr={regErr}
        isLoading={isLoading}
        isSubmitDisabled={!formik.isValid || !formik.dirty || !isAgree}
        submitLabel={tOnb('reg.button_signup')}
        isAgree={isAgree}
        agreeText={tOnb('reg.agree_text')}
        termsHref="https://info.reli.one/new-term"
        termsLabel={tOnb('reg.terms_link')}
        andLabel={tOnb('reg.and')}
        privacyLabel={tOnb('reg.privacy_link')}
        onPrivacyClick={() => navigate('/privacy-policy')}
        onFieldChange={formik.handleChange}
        onFieldBlur={formik.handleBlur}
        onPhoneChange={(event) => {
          const val = event.target.value;

          if (val === '' || val === ' ') {
            formik.setFieldValue('phone_number', '+');
            return;
          }

          if (/^\+\d*$/.test(val)) {
            formik.setFieldValue('phone_number', val);
          }
        }}
        onPhoneFocus={() => {
          if (!formik.values.phone_number) {
            formik.setFieldValue('phone_number', '+');
          }
        }}
        onAgreeChange={(checked) => setIsAgree(Boolean(checked))}
        onSubmit={(event) => {
          event.preventDefault();
          formik.handleSubmit();
        }}
      />
    </SellerOnboardingLayout>
  );
};

export default CreateForm;
