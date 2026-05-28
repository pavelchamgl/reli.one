import { useFormik } from 'formik';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import WhareHouseAddress from '../../Components/Seller/auth/sellerInfo/WareHouseAddress/WhareHouseAddress';
import ReturnAddress from '../../Components/Seller/auth/sellerInfo/ReturnAddress/ReturnAddress';
import BankAccount from '../../Components/Seller/auth/sellerInfo/BankAccount/BankAccount';
import CompanyAddress from '../../Components/Seller/auth/sellerInfo/CompanyAddress/CompanyAddress';
import CompanyInfo from '../../Components/Seller/auth/sellerInfo/CompanyInfo/CompanyInfo';
import Representative from '../../Components/Seller/auth/sellerInfo/Representative/Representative';
import {
  SellerOnboardingLayout,
} from '@/components/seller/onboarding';
import { SellerDataFormPageView } from '@/components/seller/onboarding/views/data';
import { useActionSafeEmploed } from '../../hook/useActionSafeEmploed';
import {
  putCompanyAddress,
  putCompanyInfo,
  putOnboardingBank,
  putRepresentative,
  putReturnAddress,
  putWarehouse,
} from '../../api/seller/onboarding';
import { companyValidationSchema } from '../../code/seller/validation';
import { ErrToast } from '../../ui/Toastify';
import { toISODate } from '../../code/seller';

const SellerCompanyInfo = () => {
  const firstName = JSON.parse(localStorage.getItem('first_name')) || '';
  const lastName = JSON.parse(localStorage.getItem('last_name')) || '';

  const { companyData, companyDataLoading } = useSelector((state) => state.selfEmploed);
  const { safeCompanyData, getAllCompanyDataBD } = useActionSafeEmploed();
  const navigate = useNavigate();
  const { t } = useTranslation('onbording');

  const formik = useFormik({
    initialValues: {
      company_name: companyData?.company_name ?? '',
      legal_form: companyData?.legal_form ?? '',
      country_of_registration: companyData?.country_of_registration ?? '',
      business_id: companyData?.business_id ?? '',
      tin: companyData?.tin ?? '',
      eori_number: companyData?.eori_number ?? '',
      company_phone: companyData?.company_phone ?? '',
      imports_to_eu: true,
      certificate_issue_date: companyData?.certificate_issue_date ?? '',
      first_name: firstName,
      last_name: lastName,
      role: companyData?.role ?? '',
      date_of_birth: companyData?.date_of_birth ?? '',
      nationality: companyData?.nationality ?? '',
      street: companyData?.street ?? '',
      city: companyData?.city ?? '',
      zip_code: companyData?.zip_code ?? '',
      country: companyData?.country ?? '',
      proof_document_issue_date: companyData?.proof_document_issue_date ?? '',
      iban: companyData?.iban ?? '',
      swift_bic: companyData?.swift_bic ?? '',
      account_holder: companyData?.account_holder ?? '',
      bank_code: companyData?.bank_code ?? '',
      local_account_number: companyData?.local_account_number ?? '',
      same_as_the_primary_address: companyData?.same_as_the_primary_address ?? false,
      wStreet: companyData?.wStreet ?? '',
      wCity: companyData?.wCity ?? '',
      wZip_code: companyData?.wZip_code ?? '',
      wCountry: companyData?.wCountry ?? '',
      contact_phone: companyData?.contact_phone ?? '',
      wProof_document_issue_date: companyData?.wProof_document_issue_date ?? '',
      same_as_warehouse: false,
      rStreet: companyData?.rStreet ?? '',
      rCity: companyData?.rCity ?? '',
      rZip_code: companyData?.rZip_code ?? '',
      rCountry: companyData?.rCountry ?? '',
      rContact_phone: companyData?.rContact_phone ?? '',
      rProof_document_issue_date: companyData?.rProof_document_issue_date ?? '',
    },
    validationSchema: companyValidationSchema,
    enableReinitialize: true,
    validateOnChange: true,
    onSubmit: async (values) => {
      safeCompanyData({ ...values });

      localStorage.setItem('first_name', JSON.stringify(values.first_name));
      localStorage.setItem('last_name', JSON.stringify(values.last_name));

      try {
        const requests = [
          putCompanyInfo({
            company_name: values.company_name,
            legal_form: values?.legal_form,
            country_of_registration: values?.country_of_registration,
            business_id: values?.business_id,
            tin: values?.tin,
            imports_to_eu: true,
            eori_number: values?.eori_number,
            company_phone: values?.company_phone,
            certificate_issue_date: toISODate(values.certificate_issue_date),
          }),
          putRepresentative({
            first_name: values?.first_name,
            last_name: values?.last_name,
            role: values?.role,
            date_of_birth: values?.date_of_birth?.split('.')?.reverse()?.join('-'),
            nationality: values?.nationality,
          }),
          putCompanyAddress({
            street: values.street,
            city: values.city,
            zip_code: values.zip_code,
            country: values?.country,
            proof_document_issue_date: toISODate(values.proof_document_issue_date),
          }),
          putOnboardingBank({
            iban: values?.iban,
            swift_bic: values?.swift_bic,
            account_holder: values?.account_holder,
            bank_code: values?.bank_code,
            local_account_number: values?.local_account_number,
          }),
          putWarehouse({
            same_as_the_primary_address: values.same_as_the_primary_address,
            street: values.wStreet,
            city: values.wCity,
            zip_code: values.wZip_code,
            country: values.wCountry,
            contact_phone: values.contact_phone,
            proof_document_issue_date: toISODate(values.wProof_document_issue_date),
          }),
          putReturnAddress({
            same_as_warehouse: values.same_as_warehouse,
            street: values.rStreet,
            city: values.rCity,
            zip_code: values.rZip_code,
            country: values.rCountry,
            contact_phone: values.rContact_phone,
            proof_document_issue_date: toISODate(values.rProof_document_issue_date),
          }),
        ];

        const results = await Promise.allSettled(requests);

        const errors = results
          .filter((result) => result.status === 'rejected')
          .map((result) => result.reason?.message || 'Unknown error');

        if (errors.length > 0) {
          ErrToast(`Some requests failed:\n${errors.join('\n')}`);
          return;
        }

        navigate('/seller/seller-review-company');
      } catch (err) {
        ErrToast('Unexpected error occurred. Please try again.');
      }
    },
  });

  useEffect(() => {
    getAllCompanyDataBD();
  }, []);

  if (companyDataLoading) {
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
        <CompanyInfo formik={formik} />
        <Representative formik={formik} />
        <CompanyAddress formik={formik} />
        <BankAccount formik={formik} />
        <WhareHouseAddress formik={formik} />
        <ReturnAddress formik={formik} />
      </SellerDataFormPageView>
    </SellerOnboardingLayout>
  );
};

export default SellerCompanyInfo;
