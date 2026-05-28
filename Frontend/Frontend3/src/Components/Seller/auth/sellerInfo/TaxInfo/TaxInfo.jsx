import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { FormField } from '@/components/seller/onboarding';
import {
  OnboardingDataSection,
} from '@/components/seller/onboarding/views/data';
import SellerInfoSellect from '../sellerinfoSellect/SellerInfoSellect';
import { putTax } from '../../../../../api/seller/onboarding';
import { countriesArr } from '../../../../../code/seller';
import taxInfo from '../../../../../assets/Seller/register/taxInfo.svg';
import { useActionSafeEmploed } from '../../../../../hook/useActionSafeEmploed';

const TaxInfo = ({ formik, onClosePreview }) => {
  const { selfData } = useSelector((state) => state.selfEmploed);
  const { safeData } = useActionSafeEmploed();
  const [country, setCountry] = useState(selfData?.tax_country);
  const taxDataRef = useRef(null);
  const { pathname } = useLocation();
  const { t } = useTranslation('onbording');

  const isTaxDataFilled = (values) => Boolean(values.tax_country && values.tin);

  const onLeaveTaxBlock = async () => {
    if (!isTaxDataFilled(formik.values)) return;

    const payload = {
      tax_country: formik.values.tax_country,
      tin: formik.values.tin,
      ico: formik.values.ico,
      vat_id: formik.values.vat_id,
    };

    if (pathname === '/seller/seller-review') {
      safeData(payload);
    }

    try {
      await putTax({
        tax_country: country,
        tin: payload.tin,
        business_id: payload.ico,
        vat_id: payload.vat_id,
      });
      onClosePreview?.();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <OnboardingDataSection
      sectionRef={taxDataRef}
      iconSrc={taxInfo}
      title={t('onboard.tax_address.tax_info')}
      onSectionBlur={onLeaveTaxBlock}
    >
      <SellerInfoSellect
        arr={countriesArr}
        title={t('onboard.tax_address.tax_country')}
        titleSellect={t('onboard.tax_address.select_tax_country')}
        value={formik.values.tax_country}
        setValue={(value) => {
          formik.setFieldValue('tax_country', value);
          setCountry(value);
        }}
        errText={t('onboard.tax_address.tax_country_required')}
      />
      <FormField
        id="ico"
        label={t('onboard.company.business_id')}
        error={formik.touched.ico ? formik.errors.ico : undefined}
        required
      >
        <Input
          id="ico"
          name="ico"
          value={formik.values.ico}
          placeholder="123456789"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>
      <FormField
        id="tin"
        label={t('onboard.company.tin')}
        error={formik.touched.tin ? formik.errors.tin : undefined}
        required
      >
        <Input
          id="tin"
          name="tin"
          value={formik.values.tin}
          placeholder="123456789"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>
    </OnboardingDataSection>
  );
};

export default TaxInfo;
