import { useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ErrToast } from '../../../../../ui/Toastify';

import representativeIc from '../../../../../assets/Seller/register/representativeIc.svg';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/seller/onboarding';
import {
  DateOfBirthFieldView,
  OnboardingDataSection,
} from '@/components/seller/onboarding/views/data';
import SellerInfoSellect from '../sellerinfoSellect/SellerInfoSellect';
import { useActionSafeEmploed } from '../../../../../hook/useActionSafeEmploed';
import { putRepresentative } from '../../../../../api/seller/onboarding';
import { countriesArr } from '../../../../../code/seller';

const Representative = ({ formik, onClosePreview }) => {
  const { safeCompanyData } = useActionSafeEmploed();
  const representativeRef = useRef(null);
  const { pathname } = useLocation();
  const { t } = useTranslation('onbording');

  const isRepresentativeFilled = (values) =>
    Boolean(values.first_name && values.last_name && values.date_of_birth);

  const onLeavePersonalBlock = async () => {
    if (!isRepresentativeFilled(formik.values)) return;

    const payload = {
      first_name: formik.values.first_name,
      last_name: formik.values.last_name,
      role: formik.values.role,
      date_of_birth: formik.values.date_of_birth,
      nationality: formik.values.nationality,
    };

    if (pathname === '/seller/seller-review-company') {
      safeCompanyData(payload);
    }

    localStorage.setItem('first_name', JSON.stringify(payload.first_name));
    localStorage.setItem('last_name', JSON.stringify(payload.last_name));

    try {
      await putRepresentative({
        ...payload,
        date_of_birth: payload.date_of_birth?.split('.')?.reverse()?.join('-'),
      });
      onClosePreview?.();
    } catch (err) {
      ErrToast(err?.message || t('onboard.common.error_save'));
    }
  };

  const roleArr = [
    { text: t('onboard.representative.role_owner'), value: 'Owner' },
    { text: t('onboard.representative.role_director'), value: 'Director' },
    { text: t('onboard.representative.role_managing'), value: 'Managing Director' },
    { text: t('onboard.representative.role_ceo'), value: 'CEO' },
    { text: t('onboard.representative.role_signatory'), value: 'Authorized Signatory' },
  ];

  return (
    <OnboardingDataSection
      sectionRef={representativeRef}
      iconSrc={representativeIc}
      title={t('onboard.representative.title')}
      onSectionBlur={onLeavePersonalBlock}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="first_name"
          label={t('onboard.reg.first_name')}
          error={formik.touched.first_name ? formik.errors.first_name : undefined}
          required
        >
          <Input
            id="first_name"
            name="first_name"
            value={formik.values.first_name}
            placeholder="Jane"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
        </FormField>
        <FormField
          id="last_name"
          label={t('onboard.reg.last_name')}
          error={formik.touched.last_name ? formik.errors.last_name : undefined}
          required
        >
          <Input
            id="last_name"
            name="last_name"
            value={formik.values.last_name}
            placeholder="Smith"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
        </FormField>
      </div>
      <SellerInfoSellect
        arr={roleArr}
        title={t('onboard.review.role')}
        titleSellect={t('onboard.representative.select_role')}
        value={formik.values.role}
        setValue={(value) => formik.setFieldValue('role', value)}
        errText={t('onboard.representative.role_required')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <DateOfBirthFieldView
          value={formik.values.date_of_birth}
          error={
            formik.touched.date_of_birth ? formik.errors.date_of_birth : undefined
          }
          label={t('onboard.seller_info.date_of_birth')}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        <SellerInfoSellect
          arr={countriesArr}
          title={t('onboard.seller_info.nationality')}
          titleSellect={t('onboard.representative.select_nat')}
          value={formik.values.nationality}
          setValue={(value) => formik.setFieldValue('nationality', value)}
          errText={t('onboard.representative.nat_required')}
        />
      </div>
    </OnboardingDataSection>
  );
};

export default Representative;
