import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import returnAddress from '../../../../../assets/Seller/register/returnAddress.svg';
import UploadInp from '../uploadInp/UploadInp';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/seller/onboarding';
import { onboardingControlClassName } from '@/components/seller/onboarding/onboardingControlStyles';
import {
  AddressFieldsView,
  OnboardingDataSection,
} from '@/components/seller/onboarding/views/data';
import { putReturnAddress, uploadSingleDocument } from '../../../../../api/seller/onboarding';
import { countriesArr, toISODate } from '../../../../../code/seller';
import { ErrToast } from '../../../../../ui/Toastify';

const ReturnAddress = ({ formik }) => {
  const isLinked = formik.values.same_as_warehouse;
  const [uploadStatus, setUploadStatus] = useState('');
  const rAddressRef = useRef(null);
  const { t } = useTranslation('onbording');

  const countryOptions = countriesArr.map((item) => ({
    value: item.value,
    label: item.key ? t(item.key) : item.text,
  }));

  const handleSameAsWarehouse = (checked) => {
    formik.setFieldValue('same_as_warehouse', checked);

    if (!checked) {
      formik.setFieldValue('rStreet', '');
      formik.setFieldValue('rCity', '');
      formik.setFieldValue('rZip_code', '');
      formik.setFieldValue('rCountry', null);
      formik.setFieldValue('rContact_phone', '');
      formik.setFieldValue('rProof_document_issue_date', '');
    } else {
      formik.setFieldValue('rStreet', formik.values?.wStreet ?? '');
      formik.setFieldValue('rCity', formik.values?.wCity ?? '');
      formik.setFieldValue('rZip_code', formik.values?.wZip_code ?? '');
      formik.setFieldValue('rCountry', formik.values?.wCountry ?? null);
      formik.setFieldValue('rContact_phone', formik.values?.contact_phone ?? '');
    }
    setTimeout(() => formik.validateForm(), 0);
  };

  const isReturnFilled = (values) =>
    Boolean(values.rStreet && values.rCity && values.rZip_code && values.rCountry && values.rContact_phone);

  const onLeaveReturnBlock = async () => {
    if (!isReturnFilled(formik.values)) return;

    const isoDate = toISODate(formik.values.rProof_document_issue_date);
    try {
      await putReturnAddress({
        same_as_warehouse: formik.values.same_as_warehouse,
        street: formik.values.rStreet,
        city: formik.values.rCity,
        zip_code: formik.values.rZip_code,
        country: formik.values.rCountry,
        contact_phone: formik.values.rContact_phone,
        ...(isoDate ? { proof_document_issue_date: isoDate } : {}),
      });
    } catch (err) {
      ErrToast(err?.message || t('onboard.common.error_save'));
    }
  };

  const handleSingleFrontUpload = ({ file, doc_type, scope, side }) => {
    uploadSingleDocument({ file, doc_type, scope, side })
      .then((res) => {
        formik.setFieldValue('rProof_document_issue_date', res.uploaded_at);
        setUploadStatus('full');
      })
      .catch((err) => {
        setUploadStatus('rej');
        ErrToast(err.message);
      });
  };

  return (
    <OnboardingDataSection
      sectionRef={rAddressRef}
      iconSrc={returnAddress}
      title={t('onboard.return.title')}
      onSectionBlur={onLeaveReturnBlock}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          id="same_as_warehouse"
          checked={formik.values.same_as_warehouse}
          onCheckedChange={handleSameAsWarehouse}
        />
        <label htmlFor="same_as_warehouse" className="text-sm">
          {t('onboard.return.same_as_warehouse')}
        </label>
      </div>
      <AddressFieldsView
        values={formik.values}
        errors={formik.errors}
        onFieldChange={formik.handleChange}
        onFieldBlur={formik.handleBlur}
        fieldKeys={{
          street: 'rStreet',
          city: 'rCity',
          zip_code: 'rZip_code',
          country: 'rCountry',
        }}
        countryOptions={countryOptions}
        countryPlaceholder={t('onboard.common.select')}
        labels={{
          street: t('onboard.tax_address.street'),
          city: t('onboard.tax_address.city'),
          zip: t('onboard.tax_address.zip'),
          country: t('onboard.tax_address.country'),
        }}
      />
      <FormField
        id="rContact_phone"
        label={t('onboard.warehouse.contact_phone')}
        error={formik.touched.rContact_phone ? formik.errors.rContact_phone : undefined}
        required
      >
        <Input
          id="rContact_phone"
          name="rContact_phone"
          type="tel"
          className={onboardingControlClassName}
          value={formik.values.rContact_phone}
          placeholder="+420 987 654 321"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>
      {!isLinked ? (
        <UploadInp
          title={t('onboard.tax_address.proof_address')}
          description={t('onboard.tax_address.proof_desc')}
          side={null}
          docType="proof_of_address"
          scope="return_address"
          onChange={handleSingleFrontUpload}
          inpText={t('onboard.tax_address.upload_doc')}
          stateName={formik.values.rProof_document_name}
          nameTitle="return_address"
          uploadStatus={uploadStatus}
        />
      ) : null}
    </OnboardingDataSection>
  );
};

export default ReturnAddress;
