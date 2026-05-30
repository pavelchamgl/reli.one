import { useFormik } from 'formik';
import * as yup from 'yup';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import AuthBtnSeller from '../../../../ui/Seller/auth/authBtnSeller/AuthBtnSeller';
import InputSeller from '../../../../ui/Seller/auth/inputSeller/InputSeller';
import TitleAndDesc from '../../../../ui/Seller/auth/titleAndDesc/TitleAndDesc';
import { createNewPassApi } from '../../../../api/auth';

import xIc from '../../../../assets/Seller/auth/xIc.svg';
import mark from '../../../../assets/Seller/auth/mark.svg';

import styles from './CreatePassForm.module.scss';

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

  const hasMinLength = password.length >= 8;
  const hasUppercase = password.match(/[A-ZА-Я]/g)?.length > 0;
  const hasDigit = password.match(/\d/g)?.length > 0;
  const hasSpecial = password.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/g)?.length > 0;

  return (
    <div className={styles.main}>
      <TitleAndDesc
        title={tOnb('auth.title')}
        desc={tOnb('auth.description')}
      />

      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          formik.handleSubmit();
        }}
      >
        <InputSeller
          type="password"
          title={tOnb('auth.label_password')}
          placeholder={tOnb('auth.placeholder_password')}
          name="password"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.password}
        />

        <div className={styles.validationBlock}>
          <p>{tOnb('auth.requirements_title')}</p>
          <ul>
            <li className={hasMinLength ? styles.greenText : styles.greyList}>
              <img src={hasMinLength ? mark : xIc} alt="" />
              {tOnb('auth.req_length')}
            </li>
            <li className={hasUppercase ? styles.greenText : styles.greyList}>
              <img src={hasUppercase ? mark : xIc} alt="" />
              {tOnb('auth.req_uppercase')}
            </li>
            <li className={hasDigit ? styles.greenText : styles.greyList}>
              <img src={hasDigit ? mark : xIc} alt="" />
              {tOnb('auth.req_digit')}
            </li>
            <li className={hasSpecial ? styles.greenText : styles.greyList}>
              <img src={hasSpecial ? mark : xIc} alt="" />
              {tOnb('auth.req_special')}
            </li>
          </ul>
        </div>

        <InputSeller
          type="password"
          title={tOnb('auth.label_confirm_password')}
          placeholder={tOnb('auth.placeholder_confirm_password')}
          name="confirm_password"
          value={formik.values.confirm_password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.confirm_password}
        />

        {regErr ? <p className={styles.errorText}>{regErr}</p> : null}

        <AuthBtnSeller
          loading={isLoading}
          disabled={!formik.isValid || !formik.dirty}
          text={tOnb('auth.button_save')}
        />
      </form>

      <div className={styles.bottomLinkWrap}>
        <p>{tOnb('auth.footer_note')}</p>
      </div>
    </div>
  );
};

export default CreatePassForm;
