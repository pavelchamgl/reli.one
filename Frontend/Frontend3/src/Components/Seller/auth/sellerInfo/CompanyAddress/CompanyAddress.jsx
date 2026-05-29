import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import companyAddressIc from '../../../../../assets/Seller/register/companyAddress.svg';
import UploadInp from '../uploadInp/UploadInp';
import {
  AddressFieldsView,
  OnboardingDataSection,
} from '@/components/seller/onboarding/views/data';
import { useActionSafeEmploed } from '../../../../../hook/useActionSafeEmploed';
import { putCompanyAddress, uploadSingleDocument } from '../../../../../api/seller/onboarding';
import { countriesArr, toISODate } from '../../../../../code/seller';
import { ErrToast } from '../../../../../ui/Toastify';

const CompanyAddress = ({ formik, onClosePreview }) => {
  const { companyData } = useSelector((state) => state.selfEmploed);
  const { safeCompanyData } = useActionSafeEmploed();
  const [uploadStatus, setUploadStatus] = useState('');
  const companyAddressRef = useRef(null);
  const ignoreBlurRef = useRef(false);
  const { pathname } = useLocation();
  const { t } = useTranslation('onbording');

  const countryOptions = countriesArr.map((item) => ({
    value: item.value,
    label: item.key ? t(item.key) : item.text,
  }));

  const isCompanyAddressFilled = (values) =>
    Boolean(values.street && values.city && values.zip_code && values.country);

  const onLeaveCompanyAddressBlock = async () => {
    if (!isCompanyAddressFilled(formik.values)) return;

    const payload = {
      street: formik.values.street,
      city: formik.values.city,
      zip_code: formik.values.zip_code,
      country: formik.values.country,
      proof_document_issue_date: formik.values.proof_document_issue_date,
    };

    if (pathname === '/seller/seller-review-company') {
      safeCompanyData(payload);
    }

    const isoDate = toISODate(payload.proof_document_issue_date);
    try {
      await putCompanyAddress({
        ...payload,
        ...(isoDate ? { proof_document_issue_date: isoDate } : {}),
      });
      onClosePreview?.();
    } catch (err) {
      ErrToast(err?.message || t('onboard.common.error_save'));
    }
  };

  const handleSingleFrontUpload = ({ file, doc_type, scope, side }) => {
    uploadSingleDocument({ file, doc_type, scope, side })
      .then((res) => {
        formik.setFieldValue('proof_document_issue_date', res.uploaded_at);
        setUploadStatus('full');
      })
      .catch((err) => {
        setUploadStatus('rej');
        ErrToast(err.message);
      });
  };

  return (
    <OnboardingDataSection
      sectionRef={companyAddressRef}
      iconSrc={companyAddressIc}
      title={t('onboard.tax_address.title_business')}
      onSectionBlur={onLeaveCompanyAddressBlock}
      ignoreBlurRef={ignoreBlurRef}
    >
      <AddressFieldsView
        values={formik.values}
        errors={formik.errors}
        onFieldChange={formik.handleChange}
        onFieldBlur={formik.handleBlur}
        countryOptions={countryOptions}
        countryPlaceholder={t('onboard.common.select')}
        streetPlaceholder="Industrial Street 456"
        cityPlaceholder="Brno"
        zipPlaceholder="602 00"
        labels={{
          street: t('onboard.tax_address.street'),
          city: t('onboard.tax_address.city'),
          zip: t('onboard.tax_address.zip'),
          country: t('onboard.tax_address.country'),
        }}
      />
      <UploadInp
        title={t('onboard.tax_address.proof_address')}
        description={t('onboard.company.cert_desc')}
        scope="company_address"
        docType="proof_of_address"
        side={null}
        onChange={handleSingleFrontUpload}
        inpText={t('onboard.common.upload')}
        stateName={companyData?.company_address_name}
        nameTitle="company_address_name"
        onMouseDown={() => {
          ignoreBlurRef.current = true;
        }}
        uploadStatus={uploadStatus}
      />
      {formik.errors.proof_document_issue_date ? (
        <p className="text-sm text-destructive">{formik.errors.proof_document_issue_date}</p>
      ) : null}
    </OnboardingDataSection>
  );
};

export default CompanyAddress;
