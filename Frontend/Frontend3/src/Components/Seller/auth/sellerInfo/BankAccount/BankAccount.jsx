import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { putOnboardingBank } from '../../../../../api/seller/onboarding';
import bankAcc from '../../../../../assets/Seller/register/bankAcc.svg';
import { useActionSafeEmploed } from '../../../../../hook/useActionSafeEmploed';
import { ErrToast } from '../../../../../ui/Toastify';
import { getAccountData } from '../../../../../api/seller/getOnboardingData';
import {
  BankAccountFieldsView,
  OnboardingDataSection,
} from '@/components/seller/onboarding/views/data';

const BankAccount = ({ formik, onClosePreview }) => {
  const { pathname } = useLocation();
  const { safeData } = useActionSafeEmploed();
  const bankRef = useRef(null);
  const { t } = useTranslation('onbording');

  const normalize = (val) => val?.toLowerCase()?.trim();
  const tax_country = normalize(formik.values.tax_country);
  const business_country = normalize(formik.values.country);
  const activeCountry = tax_country || business_country;
  const isCzSk = ['cz', 'sk'].includes(activeCountry);

  const cleanName = (str) =>
    str
      ?.replace(/[^\p{L}\s-]/gu, '')
      .replace(/\s+/g, ' ')
      .trim() || '';

  const getExpectedHolderName = () => {
    if (pathname.includes('company')) {
      const cleanLegalForm = formik.values.legal_form?.replace(/\s*\(.*?\)/, '') || '';
      const companyName = formik.values.company_name || '';
      return `${companyName} ${cleanLegalForm}`.trim();
    }

    const first = cleanName(formik.values.first_name);
    const last = cleanName(formik.values.last_name);
    return `${first} ${last}`.trim();
  };

  useEffect(() => {
    const expected = getExpectedHolderName();
    if (expected) {
      formik.setFieldValue('account_holder', expected);
    }
  }, [
    formik.values.company_name,
    formik.values.legal_form,
    formik.values.first_name,
    formik.values.last_name,
    pathname,
  ]);

  useEffect(() => {
    if (!pathname.includes('company')) {
      getAccountData()
        .then((res) => {
          formik.setFieldValue('first_name', res.first_name);
          formik.setFieldValue('last_name', res.last_name);
        })
        .catch((err) => {
          console.error('Ошибка при получении данных:', err);
        });
    }
  }, [pathname]);

  useEffect(() => {
    if (!isCzSk) {
      formik.setFieldValue('bank_code', '', false);
      formik.setFieldValue('local_account_number', '', false);
    }
  }, [tax_country, business_country]);

  const isBankDataFilled = (values) =>
    Boolean(values.iban && values.swift_bic && values.account_holder);

  const onLeaveBankBlock = async () => {
    const payload = {
      iban: formik.values.iban,
      swift_bic: formik.values.swift_bic,
      account_holder: formik.values.account_holder,
      ...(isCzSk && {
        bank_code: formik.values.bank_code,
        local_account_number: formik.values.local_account_number,
      }),
    };

    if (!isBankDataFilled(payload)) return;

    const expectedName = getExpectedHolderName();
    if (payload.account_holder.trim() !== expectedName) {
      formik.setFieldError('account_holder', t('onboard.bank.holder_error_mismatch'));
      ErrToast(t('onboard.bank.holder_error_mismatch'));
      return;
    }

    if (pathname === '/seller/seller-review') safeData(payload);

    try {
      await putOnboardingBank(payload);
      onClosePreview?.();
    } catch (err) {
      const message = err?.message || t('onboard.common.error_save');
      formik.setFieldError('account_holder', message);
      ErrToast(message);
    }
  };

  return (
    <OnboardingDataSection
      sectionRef={bankRef}
      iconSrc={bankAcc}
      title={t('onboard.bank.title')}
      onSectionBlur={onLeaveBankBlock}
    >
      <BankAccountFieldsView
        values={formik.values}
        errors={formik.errors}
        onFieldChange={formik.handleChange}
        onFieldBlur={formik.handleBlur}
        showCzSkFields={isCzSk}
        accountHolderDisabled
        labels={{
          iban: t('onboard.bank.iban'),
          swift: t('onboard.bank.swift'),
          holder: t('onboard.bank.holder'),
          bankCode: t('onboard.bank.bank_code'),
          localAccount: t('onboard.bank.local_acc'),
        }}
      />
    </OnboardingDataSection>
  );
};

export default BankAccount;
