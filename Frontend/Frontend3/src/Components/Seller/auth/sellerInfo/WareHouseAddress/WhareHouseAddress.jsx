import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import warehouseIc from '../../../../../assets/Seller/register/warehouseIc.svg';
import UploadInp from '../uploadInp/UploadInp';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/seller/onboarding';
import {
  AddressFieldsView,
  OnboardingDataSection,
} from '@/components/seller/onboarding/views/data';
import { useActionSafeEmploed } from '../../../../../hook/useActionSafeEmploed';
import { putWarehouse, uploadSingleDocument } from '../../../../../api/seller/onboarding';
import { countriesArr, toISODate } from '../../../../../code/seller';
import { ErrToast } from '../../../../../ui/Toastify';

const WhareHouseAddress = ({ formik }) => {
  const { pathname } = useLocation();
  const companyPathname = '/seller/seller-company';
  const { selfData, companyData } = useSelector((state) => state.selfEmploed);
  const resultData = companyPathname === pathname ? companyData : selfData;
  const [uploadStatus, setUploadStatus] = useState('');
  const warehouseRef = useRef(null);
  const ignoreBlurRef = useRef(false);
  const { t } = useTranslation('onbording');

  const countryOptions = countriesArr.map((item) => ({
    value: item.value,
    label: item.key ? t(item.key) : item.text,
  }));

  const handleSameAsPrimaryAddress = (checked) => {
    formik.setFieldValue('same_as_the_primary_address', checked);

    if (!checked) {
      formik.setFieldValue('wStreet', '');
      formik.setFieldValue('wCity', '');
      formik.setFieldValue('wZip_code', '');
      formik.setFieldValue('wCountry', null);
      formik.setFieldValue('contact_phone', '');
      return;
    }

    formik.setFieldValue('wStreet', formik.values.street || '');
    formik.setFieldValue('wCity', formik.values.city || '');
    formik.setFieldValue('wZip_code', formik.values.zip_code || '');
    formik.setFieldValue('wCountry', formik.values.country || null);
    formik.setFieldValue('contact_phone', formik.values.contact_phone || '');
    setTimeout(() => formik.validateForm(), 0);
  };

  const isWarehouseFilled = (values) =>
    Boolean(values.wStreet && values.wCity && values.wZip_code && values.contact_phone);

  const onLeaveWarehouseBlock = () => {
    if (!isWarehouseFilled(formik.values)) return;

    putWarehouse({
      same_as_the_primary_address: formik.values.same_as_the_primary_address,
      street: formik.values.wStreet,
      city: formik.values.wCity,
      zip_code: formik.values.wZip_code,
      country: formik.values.wCountry,
      contact_phone: formik.values.contact_phone,
      proof_document_issue_date: toISODate(formik.values.wProof_document_issue_date),
    });
  };

  const handleSingleFrontUpload = ({ file, doc_type, scope, side }) => {
    uploadSingleDocument({ file, doc_type, scope, side })
      .then((res) => {
        formik.setFieldValue('wProof_document_issue_date', res.uploaded_at);
        setUploadStatus('full');
      })
      .catch((err) => {
        setUploadStatus('rej');
        ErrToast(err.message);
      });
  };

  return (
    <OnboardingDataSection
      sectionRef={warehouseRef}
      iconSrc={warehouseIc}
      title={t('onboard.warehouse.title')}
      onSectionBlur={onLeaveWarehouseBlock}
      ignoreBlurRef={ignoreBlurRef}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          id="same_as_the_primary_address"
          checked={formik.values.same_as_the_primary_address}
          onCheckedChange={handleSameAsPrimaryAddress}
        />
        <label htmlFor="same_as_the_primary_address" className="text-sm">
          Same as the primary address
        </label>
      </div>
      <AddressFieldsView
        values={formik.values}
        errors={formik.errors}
        onFieldChange={formik.handleChange}
        onFieldBlur={formik.handleBlur}
        fieldKeys={{
          street: 'wStreet',
          city: 'wCity',
          zip_code: 'wZip_code',
          country: 'wCountry',
        }}
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
      <FormField
        id="contact_phone"
        label={t('onboard.warehouse.contact_phone')}
        error={formik.touched.contact_phone ? formik.errors.contact_phone : undefined}
        required
      >
        <Input
          id="contact_phone"
          name="contact_phone"
          type="tel"
          value={formik.values.contact_phone}
          placeholder="+420 987 654 321"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </FormField>
      <UploadInp
        title={t('onboard.tax_address.proof_address')}
        description={t('onboard.tax_address.proof_desc')}
        side={null}
        docType="proof_of_address"
        inpText={t('onboard.tax_address.upload_doc')}
        scope="warehouse_address"
        onChange={handleSingleFrontUpload}
        stateName={resultData?.warehouse_name}
        nameTitle="warehouse_name"
        onMouseDown={() => {
          ignoreBlurRef.current = true;
        }}
        uploadStatus={uploadStatus}
      />
    </OnboardingDataSection>
  );
};

export default WhareHouseAddress;
