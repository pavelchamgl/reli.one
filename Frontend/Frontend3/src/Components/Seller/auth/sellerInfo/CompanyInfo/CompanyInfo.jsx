import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import companyIc from '../../../../../assets/Seller/register/companyIcon.svg';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/seller/onboarding';
import { OnboardingDataSection } from '@/components/seller/onboarding/views/data';
import SellerInfoSellect from '../sellerinfoSellect/SellerInfoSellect';
import UploadInp from '../uploadInp/UploadInp';
import { useActionSafeEmploed } from '../../../../../hook/useActionSafeEmploed';
import { putCompanyInfo, uploadSingleDocument } from '../../../../../api/seller/onboarding';
import { countriesArr, toISODate } from '../../../../../code/seller';
import { ErrToast } from '../../../../../ui/Toastify';

const CompanyInfo = ({ formik, onClosePreview }) => {
  const { companyData } = useSelector((state) => state.selfEmploed);
  const { safeCompanyData } = useActionSafeEmploed();
  const [uploadStatus, setUploadStatus] = useState('');
  const companyRef = useRef(null);
  const ignoreBlurRef = useRef(false);
  const { pathname } = useLocation();
  const { t } = useTranslation('onbording');

  const isCompanyFilled = (values) =>
    Boolean(
      values.company_name &&
        values.business_id &&
        values.tin &&
        values.company_phone &&
        values.certificate_issue_date
    );

  const onLeaveCompanyBlock = async () => {
    if (!isCompanyFilled(formik.values)) return;

    const payload = {
      company_name: formik.values.company_name,
      legal_form: formik.values.legal_form,
      country_of_registration: formik.values.country_of_registration,
      business_id: formik.values.business_id,
      tin: formik.values?.tin,
      eori_number: formik.values?.eori_number,
      imports_to_eu: Boolean(formik.values?.eori_number),
      company_phone: formik.values?.company_phone,
      certificate_issue_date: formik.values.certificate_issue_date,
    };

    if (pathname === '/seller/seller-review-company') {
      safeCompanyData(payload);
    }

    const isoDate = toISODate(payload.certificate_issue_date);
    try {
      await putCompanyInfo({
        ...payload,
        // Only send certificate_issue_date when it has a value to avoid
        // overwriting a previously stored date with an empty string.
        ...(isoDate ? { certificate_issue_date: isoDate } : {}),
      });
      onClosePreview?.();
    } catch (err) {
      ErrToast(err?.message || t('onboard.common.error_save'));
    }
  };

  const legalArr = [
    { value: 'GmbH (Germany)', text: t('onboard.legal_forms.gmbh') },
    { value: 'Ltd (United Kingdom)', text: t('onboard.legal_forms.ltd') },
    { value: 'S.A.R.L. (France)', text: t('onboard.legal_forms.sarl') },
    { value: 's.r.o. (Czech Republic / Slovakia)', text: t('onboard.legal_forms.sro') },
  ];

  const handleSingleFrontUpload = ({ file, doc_type, scope, side }) => {
    uploadSingleDocument({ file, doc_type, scope, side })
      .then((res) => {
        formik.setFieldValue('certificate_issue_date', res.uploaded_at);
        setUploadStatus('full');
      })
      .catch((err) => {
        setUploadStatus('rej');
        ErrToast(err.message);
      });
  };

  return (
    <OnboardingDataSection
      sectionRef={companyRef}
      iconSrc={companyIc}
      title={t('onboard.company.title')}
      onSectionBlur={onLeaveCompanyBlock}
      ignoreBlurRef={ignoreBlurRef}
    >
      <FormField
        id="company_name"
        label={t('onboard.company.name')}
        error={formik.touched.company_name ? formik.errors.company_name : undefined}
        required
      >
        <Input
          id="company_name"
          name="company_name"
          value={formik.values.company_name}
          placeholder="Official registered company name"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <SellerInfoSellect
          arr={legalArr}
          title={t('onboard.company.legal_form')}
          titleSellect={t('onboard.company.select_legal')}
          value={formik.values.legal_form}
          setValue={(value) => formik.setFieldValue('legal_form', value)}
          errText={t('onboard.company.legal_required')}
        />
        <SellerInfoSellect
          arr={countriesArr}
          title={t('onboard.company.country_reg')}
          titleSellect={t('onboard.common.select')}
          value={formik.values.country_of_registration}
          setValue={(value) => formik.setFieldValue('country_of_registration', value)}
          errText={t('onboard.company.country_required')}
        />
      </div>
      <FormField
        id="business_id"
        label={t('onboard.company.business_id')}
        error={formik.touched.business_id ? formik.errors.business_id : undefined}
        required
      >
        <Input
          id="business_id"
          name="business_id"
          value={formik.values.business_id}
          placeholder="Trade register number"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>
      <FormField
        id="tin"
        label={t('onboard.tax_address.tin_full')}
        error={formik.touched.tin ? formik.errors.tin : undefined}
        required
      >
        <Input
          id="tin"
          name="tin"
          value={formik.values.tin}
          placeholder="987654321"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>
      <FormField
        id="eori_number"
        label="EORI"
        error={formik.touched.eori_number ? formik.errors.eori_number : undefined}
      >
        <Input
          id="eori_number"
          name="eori_number"
          value={formik.values.eori_number}
          placeholder={t('onboard.company.eori_placeholder')}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>
      <UploadInp
        title={t('onboard.company.cert_title')}
        description={t('onboard.company.cert_desc')}
        scope="company_info"
        docType="registration_certificate"
        side={null}
        onChange={handleSingleFrontUpload}
        inpText={t('onboard.common.upload')}
        stateName={companyData?.company_file_date}
        nameTitle="company_file_date"
        onMouseDown={() => {
          ignoreBlurRef.current = true;
        }}
        uploadStatus={uploadStatus}
      />
      <FormField
        id="company_phone"
        label={t('onboard.company.phone')}
        error={formik.touched.company_phone ? formik.errors.company_phone : undefined}
        required
      >
        <Input
          id="company_phone"
          name="company_phone"
          type="tel"
          value={formik.values.company_phone}
          placeholder="+420 ..."
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>
    </OnboardingDataSection>
  );
};

export default CompanyInfo;
