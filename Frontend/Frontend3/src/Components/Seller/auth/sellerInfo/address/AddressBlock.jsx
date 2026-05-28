import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import addressIc from '../../../../../assets/Seller/register/addressIc.svg';
import UploadInp from '../uploadInp/UploadInp';
import { useActionSafeEmploed } from '../../../../../hook/useActionSafeEmploed';
import { putSelfAddress, uploadSingleDocument } from '../../../../../api/seller/onboarding';
import { countriesArr, toISODate } from '../../../../../code/seller';
import { ErrToast } from '../../../../../ui/Toastify';
import {
  AddressFieldsView,
  OnboardingDataSection,
} from '@/components/seller/onboarding/views/data';

const AddressBlock = ({ formik, onClosePreview }) => {
  const { selfData } = useSelector((state) => state.selfEmploed);
  const { safeData } = useActionSafeEmploed();
  const [uploadStatus, setUploadStatus] = useState('');
  const addressRef = useRef(null);
  const ignoreBlurRef = useRef(false);
  const { pathname } = useLocation();
  const { t } = useTranslation('onbording');

  const countryOptions = countriesArr.map((item) => ({
    value: item.value,
    label: item.key ? t(item.key) : item.text,
  }));

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

  const isAddressFilled = (values) =>
    Boolean(values.street && values.city && values.zip_code && values.country);

  const onLeaveAddressBlock = async () => {
    if (!isAddressFilled(formik.values)) return;

    const payload = {
      street: formik.values.street,
      city: formik.values.city,
      zip_code: formik.values.zip_code,
      country: formik.values.country,
      proof_document_issue_date: toISODate(formik.values.proof_document_issue_date),
    };

    if (pathname === '/seller/seller-review') {
      safeData(payload);
    }

    try {
      await putSelfAddress(payload);
      onClosePreview?.();
    } catch (err) {
      ErrToast(err?.message || t('onboard.common.error_save'));
    }
  };

  return (
    <OnboardingDataSection
      sectionRef={addressRef}
      iconSrc={addressIc}
      title={t('onboard.tax_address.address')}
      onSectionBlur={onLeaveAddressBlock}
      ignoreBlurRef={ignoreBlurRef}
    >
      <AddressFieldsView
        values={formik.values}
        errors={formik.errors}
        onFieldChange={formik.handleChange}
        onFieldBlur={formik.handleBlur}
        countryOptions={countryOptions}
        countryPlaceholder={t('onboard.common.select')}
        labels={{
          street: t('onboard.tax_address.street'),
          city: t('onboard.tax_address.city'),
          zip: t('onboard.tax_address.zip'),
          country: t('onboard.tax_address.country'),
        }}
      />
      <UploadInp
        title={t('onboard.tax_address.proof_address')}
        description={t('onboard.tax_address.proof_desc')}
        side={null}
        docType="proof_of_address"
        inpText={t('onboard.tax_address.upload_doc')}
        scope="self_employed_address"
        onChange={handleSingleFrontUpload}
        stateName={selfData?.self_address_name}
        nameTitle="self_address_name"
        onMouseDown={() => {
          ignoreBlurRef.current = true;
        }}
        uploadStatus={uploadStatus}
      />
      {formik.errors.proof_document_issue_date ? (
        <p className="text-sm text-destructive">{t('onboard.tax_address.upload_required')}</p>
      ) : null}
    </OnboardingDataSection>
  );
};

export default AddressBlock;
