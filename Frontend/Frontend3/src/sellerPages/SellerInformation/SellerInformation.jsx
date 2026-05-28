import { useFormik } from 'formik';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

import AddressBlock from '../../Components/Seller/auth/sellerInfo/address/AddressBlock';
import BankAccount from '../../Components/Seller/auth/sellerInfo/BankAccount/BankAccount';
import PersonalDetails from '../../Components/Seller/auth/sellerInfo/PersonalDetails/PersonalDetails';
import ReturnAddress from '../../Components/Seller/auth/sellerInfo/ReturnAddress/ReturnAddress';
import TaxInfo from '../../Components/Seller/auth/sellerInfo/TaxInfo/TaxInfo';
import WhareHouseAddress from '../../Components/Seller/auth/sellerInfo/WareHouseAddress/WhareHouseAddress';
import {
  SellerOnboardingLayout,
} from '@/components/seller/onboarding';
import { SellerDataFormPageView } from '@/components/seller/onboarding/views/data';
import { useActionSafeEmploed } from '../../hook/useActionSafeEmploed';
import {
  putOnboardingBank,
  putPersonalData,
  putReturnAddress,
  putSelfAddress,
  putTax,
  putWarehouse,
} from '../../api/seller/onboarding';
import { validationSchemaSelf } from '../../code/seller/validation';
import { ErrToast } from '../../ui/Toastify';
import { toISODate } from '../../code/seller';

const SellerInformation = () => {
  const phone = JSON.parse(localStorage.getItem('phone')) || '';

  const { safeData, getAllDataFromBD } = useActionSafeEmploed();
  const navigate = useNavigate();
  const { selfData, selfDataLoading } = useSelector((state) => state.selfEmploed);
  const { t } = useTranslation('onbording');

  const formik = useFormik({
    initialValues: {
      first_name: '',
      last_name: '',
      date_of_birth: selfData?.date_of_birth ?? '',
      nationality: selfData?.nationality ?? '',
      personal_phone: phone,
      uploadFront: selfData?.uploadFront ?? '',
      uploadBack: selfData?.uploadBack ?? '',
      tax_country: selfData?.tax_country ?? '',
      tin: selfData?.tin ?? '',
      ico: selfData?.ico ?? '',
      street: selfData?.street ?? '',
      city: selfData?.city ?? '',
      zip_code: selfData?.zip_code ?? '',
      country: selfData?.country ?? '',
      proof_document_issue_date: selfData.proof_document_issue_date ?? '',
      iban: selfData?.iban ?? '',
      swift_bic: selfData?.swift_bic ?? '',
      account_holder: selfData?.account_holder ?? '',
      bank_code: selfData?.bank_code ?? '',
      local_account_number: selfData?.local_account_number ?? '',
      same_as_the_primary_address: selfData?.same_as_the_primary_address ?? false,
      wStreet: selfData?.wStreet ?? '',
      wCity: selfData?.wCity ?? '',
      wZip_code: selfData?.wZip_code ?? '',
      wCountry: selfData?.wCountry ?? '',
      contact_phone: selfData?.contact_phone ?? '',
      wProof_document_issue_date: selfData?.wProof_document_issue_date ?? '',
      same_as_warehouse: false,
      rStreet: selfData?.rStreet ?? '',
      rCity: selfData?.rCity ?? '',
      rZip_code: selfData?.rZip_code ?? '',
      rCountry: selfData?.rCountry ?? '',
      rContact_phone: selfData?.rContact_phone ?? '',
      rProof_document_issue_date: selfData?.rProof_document_issue_date ?? '',
    },
    validationSchema: validationSchemaSelf,
    enableReinitialize: true,
    validateOnChange: true,
    onSubmit: async (values) => {
      safeData(values);
      localStorage.setItem('phone', JSON.stringify(values.personal_phone));

      const requests = [
        {
          name: 'Personal Data',
          promise: putPersonalData({
            date_of_birth: values.date_of_birth?.split('.').reverse().join('-'),
            nationality: values.nationality,
            personal_phone: values.personal_phone,
          }),
        },
        {
          name: 'Tax Info',
          promise: putTax({
            tax_country: values.tax_country,
            tin: values.tin,
            business_id: values.ico,
          }),
        },
        {
          name: 'Self Address',
          promise: putSelfAddress({
            street: values.street,
            city: values.city,
            zip_code: values.zip_code,
            country: values.country,
            proof_document_issue_date: toISODate(values.proof_document_issue_date),
          }),
        },
        {
          name: 'Bank Account',
          promise: putOnboardingBank({
            iban: values?.iban,
            swift_bic: values?.swift_bic,
            account_holder: values?.account_holder,
            bank_code: values?.bank_code,
            local_account_number: values?.local_account_number,
          }),
        },
        {
          name: 'Warehouse',
          promise: putWarehouse({
            same_as_the_primary_address: values.same_as_the_primary_address,
            street: values.wStreet,
            city: values.wCity,
            zip_code: values.wZip_code,
            country: values.wCountry,
            contact_phone: values.contact_phone,
            proof_document_issue_date: toISODate(values.wProof_document_issue_date),
          }),
        },
        {
          name: 'Return Address',
          promise: putReturnAddress({
            same_as_warehouse: values.same_as_warehouse,
            street: values.rStreet,
            city: values.rCity,
            zip_code: values.rZip_code,
            country: values.rCountry,
            contact_phone: values.rContact_phone,
            proof_document_issue_date: '2026-01-13',
          }),
        },
      ];

      try {
        const results = await Promise.allSettled(requests.map((request) => request.promise));

        const errors = results
          .map((result, index) => {
            if (result.status === 'rejected') {
              return `${requests[index].name} failed: ${result.reason?.message || result.reason}`;
            }
            return null;
          })
          .filter(Boolean);

        if (errors.length > 0) {
          ErrToast(`Some requests failed:\n${errors.join('\n')}`);
          return;
        }

        navigate('/seller/seller-review');
      } catch (err) {
        ErrToast(`Unexpected error: ${err.message || err}`);
      }
    },
  });

  useEffect(() => {
    getAllDataFromBD();
  }, []);

  if (selfDataLoading) {
    return null;
  }

  return (
    <SellerOnboardingLayout contentClassName="max-w-3xl">
      <SellerDataFormPageView
        title={t('onboard.seller_info.title')}
        description={t('onboard.seller_info.provide_info_desc')}
        step={4}
        totalSteps={6}
        stepLabel={t('reg.step_label')}
        submitLabel={t('onboard.common.continue_review')}
        isSubmitDisabled={!formik.isValid}
        onSubmit={formik.handleSubmit}
      >
        <PersonalDetails formik={formik} />
        <TaxInfo formik={formik} />
        <AddressBlock formik={formik} />
        <BankAccount formik={formik} />
        <WhareHouseAddress formik={formik} />
        <ReturnAddress formik={formik} />
      </SellerDataFormPageView>
    </SellerOnboardingLayout>
  );
};

export default SellerInformation;
