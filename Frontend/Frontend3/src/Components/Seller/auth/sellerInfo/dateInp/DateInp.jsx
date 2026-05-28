import { useTranslation } from 'react-i18next';
import { DateOfBirthFieldView } from '@/components/seller/onboarding/views/data';

const SellerDateInp = ({ formik }) => {
  const { t } = useTranslation('onbording');

  return (
    <DateOfBirthFieldView
      label={t('onboard.seller_info.date_of_birth')}
      value={formik.values.date_of_birth}
      error={
        formik.touched.date_of_birth && formik.errors.date_of_birth
          ? formik.errors.date_of_birth
          : undefined
      }
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
    />
  );
};

export default SellerDateInp;
