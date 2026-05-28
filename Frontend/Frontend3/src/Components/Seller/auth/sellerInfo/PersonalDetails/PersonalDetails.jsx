import { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { Input } from '@/components/ui/input';
import { FormField } from '@/components/seller/onboarding';
import {
  OnboardingDataSection,
  DateOfBirthFieldView,
} from '@/components/seller/onboarding/views/data';
import { useActionSafeEmploed } from '../../../../../hook/useActionSafeEmploed';
import personalIc from '../../../../../assets/Seller/register/personalDetailIc.svg';
import { putPersonalData } from '../../../../../api/seller/onboarding';
import { countriesArr } from '../../../../../code/seller';
import SellerInfoSellect from '../sellerinfoSellect/SellerInfoSellect';
import IdentDocumInp from '../../identDocumInp/IdentDocumInp';
import { patchProfileUpdate } from '../../../../../api/seller/getOnboardingData';

const PersonalDetails = ({ formik, onClosePreview }) => {
  const { selfData } = useSelector((state) => state.selfEmploed);
  const { safeData } = useActionSafeEmploed();
  const personalRef = useRef(null);
  const ignoreBlurRef = useRef(false);
  const { pathname } = useLocation();
  const { t } = useTranslation('onbording');

  const isPersonalDataFilled = (values) =>
    Boolean(values.first_name && values.last_name && values.date_of_birth && values.personal_phone);

  const onLeavePersonalBlock = async () => {
    if (!isPersonalDataFilled(formik.values)) return;

    const payload = {
      first_name: formik.values.first_name,
      last_name: formik.values.last_name,
      date_of_birth: formik.values?.date_of_birth,
      nationality: formik.values.nationality,
      personal_phone: formik.values.personal_phone,
    };

    if (pathname === '/seller/seller-review') {
      safeData(payload);
    }

    localStorage.setItem('phone', JSON.stringify(payload.personal_phone));

    try {
      const res = await patchProfileUpdate({
        first_name: formik.values.first_name,
        last_name: formik.values.last_name,
      });

      if (res?.status === 200 || res?.status === 204) {
        await putPersonalData({
          date_of_birth: payload.date_of_birth?.split('.').reverse().join('-'),
          nationality: payload.nationality,
          personal_phone: payload.personal_phone,
        });
        onClosePreview?.();
      }
    } catch (err) {
      console.error('Ошибка при сохранении:', err);
    }
  };

  return (
    <OnboardingDataSection
      sectionRef={personalRef}
      iconSrc={personalIc}
      title={t('onboard.seller_info.personal_details')}
      onSectionBlur={onLeavePersonalBlock}
      ignoreBlurRef={ignoreBlurRef}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="first_name"
          label={t('onboard.seller_info.first_name')}
          error={formik.touched.first_name ? formik.errors.first_name : undefined}
          required
        >
          <Input
            id="first_name"
            name="first_name"
            value={formik.values.first_name}
            placeholder={t('onboard.seller_info.first_name')}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
        </FormField>
        <FormField
          id="last_name"
          label={t('onboard.seller_info.last_name')}
          error={formik.touched.last_name ? formik.errors.last_name : undefined}
          required
        >
          <Input
            id="last_name"
            name="last_name"
            value={formik.values.last_name}
            placeholder={t('onboard.seller_info.last_name')}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
        </FormField>
      </div>
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
        <FormField
          id="personal_phone"
          label={t('onboard.seller_info.phone')}
          error={formik.touched.personal_phone ? formik.errors.personal_phone : undefined}
          required
        >
          <Input
            id="personal_phone"
            name="personal_phone"
            type="tel"
            value={formik.values.personal_phone}
            placeholder={t('onboard.seller_info.phone_placeholder')}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
        </FormField>
      </div>
      <SellerInfoSellect
        arr={countriesArr}
        title={t('onboard.seller_info.nationality')}
        titleSellect={t('onboard.seller_info.select_nationality')}
        value={formik.values.nationality}
        setValue={(value) => formik.setFieldValue('nationality', value)}
        errText={t('onboard.seller_info.nationality_required')}
      />
      <IdentDocumInp
        scopeProp="self_employed_personal"
        selfData={selfData}
        ref={ignoreBlurRef}
        formik={formik}
      />
    </OnboardingDataSection>
  );
};

export default PersonalDetails;
