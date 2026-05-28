import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';

import BankAccountEdit from '../../Components/Seller/auth/sellerInfo/BankAccount/BankAccount';
import CompanyAddress from '../../Components/Seller/auth/sellerInfo/CompanyAddress/CompanyAddress';
import CompanyInfoEdit from '../../Components/Seller/auth/sellerInfo/CompanyInfo/CompanyInfo';
import Representative from '../../Components/Seller/auth/sellerInfo/Representative/Representative';
import ReturnAddress from '../../Components/Seller/auth/sellerInfo/ReturnAddress/ReturnAddress';
import WhareHouseAddress from '../../Components/Seller/auth/sellerInfo/WareHouseAddress/WhareHouseAddress';
import { SellerOnboardingLayout } from '@/components/seller/onboarding';
import { CompanyReviewView } from '@/components/seller/onboarding/views/review';
import {
  getOnboardingStatus,
  getReviewOnboarding,
  postSubmitOnboarding,
  putCompanyAddress,
  putCompanyInfo,
  putOnboardingBank,
  putRepresentative,
  putReturnAddress,
  putWarehouse,
} from '../../api/seller/onboarding';
import { ErrToast } from '../../ui/Toastify';
import { useActionSafeEmploed } from '../../hook/useActionSafeEmploed';
import { companyValidationSchema } from '../../code/seller/validation';
import { toISODate } from '../../code/seller';
import {
  COMPANY_REVIEW_SECTION_IDS,
  mapCompanyReviewSections,
} from '@/features/seller-onboarding/mapCompanyReviewSections';

const SellerReviewCompany = () => {
  const { companyData, registerData } = useSelector((state) => state.selfEmploed);
  const { safeCompanyData, getAllCompanyDataBD } = useActionSafeEmploed();

  const firstName = JSON.parse(localStorage.getItem('first_name')) || '';
  const lastName = JSON.parse(localStorage.getItem('last_name')) || '';
  const email = JSON.parse(localStorage.getItem('email')) || '';

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
      uploadFront: companyData?.uploadFront ?? '',
      uploadBack: companyData?.uploadBack ?? '',
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
      same_as_warehouse: companyData?.same_as_warehouse ?? false,
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
    },
  });

  const [editingSectionId, setEditingSectionId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { t } = useTranslation('onbording');
  const navigate = useNavigate();

  useEffect(() => {
    getReviewOnboarding();
    getAllCompanyDataBD();
  }, []);

  const sections = useMemo(
    () =>
      mapCompanyReviewSections({
        data: companyData,
        registerPhone: registerData?.phone,
        firstName,
        lastName,
        email,
        t,
      }),
    [companyData, registerData?.phone, firstName, lastName, email, t]
  );

  const parseApiErrors = (data) => {
    if (!data) return ['Unknown error'];

    if (typeof data === 'string') return [data];
    if (data.detail) return [String(data.detail)];
    if (data.message) return [String(data.message)];

    const labels = {
      seller_type_selected: 'Seller type',
      personal_complete: 'Personal details',
      tax_complete: 'Tax info',
      address_complete: 'Address',
      bank_complete: 'Bank account',
      warehouse_complete: 'Warehouse',
      return_complete: 'Return address',
      documents_complete: 'Documents',
    };

    const completeness = data.completeness ?? data;

    if (completeness && typeof completeness === 'object') {
      const failed = Object.entries(completeness)
        .filter(
          ([, value]) => typeof value === 'string' && value.toLowerCase() === 'false'
        )
        .map(([key]) => labels[key] ?? key);

      if (failed.length) {
        return [`Please complete: ${failed.join(', ')}`];
      }
    }

    const messages = [];

    const walk = (obj) => {
      if (!obj) return;

      if (typeof obj === 'string') {
        messages.push(obj);
      } else if (Array.isArray(obj)) {
        obj.forEach(walk);
      } else if (typeof obj === 'object') {
        Object.values(obj).forEach(walk);
      }
    };

    walk(data);

    return messages.length ? messages : ['Unexpected error'];
  };

  const handleSubmit = async () => {
    const values = formik.values;
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const requests = [
        {
          name: 'Company Info',
          promise: putCompanyInfo({
            company_name: values.company_name,
            legal_form: values?.legal_form,
            country_of_registration: values?.country_of_registration,
            business_id: values?.business_id,
            ico: values?.ico,
            tin: values?.tin,
            imports_to_eu: true,
            eori_number: values?.eori_number,
            company_phone: values?.company_phone,
            certificate_issue_date: toISODate(values.certificate_issue_date),
          }),
        },
        {
          name: 'Representative',
          promise: putRepresentative({
            first_name: values?.first_name,
            last_name: values?.last_name,
            role: values?.role,
            date_of_birth: values?.date_of_birth?.split('.')?.reverse()?.join('-'),
            nationality: values?.nationality,
          }),
        },
        {
          name: 'Company Address',
          promise: putCompanyAddress({
            street: values.street,
            city: values.city,
            zip_code: values.zip_code,
            country: values?.country,
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

      const results = await Promise.allSettled(requests.map((request) => request.promise));

      const errors = results
        .map((result, index) => {
          if (result.status === 'rejected') {
            const data = result.reason?.response?.data;
            const messages = parseApiErrors(data);
            return `${requests[index].name}: ${messages.join(', ')}`;
          }
          return null;
        })
        .filter(Boolean);

      if (errors.length) {
        const message = errors.join('\n');
        setSubmitError(message);
        ErrToast(message);
        return;
      }

      const statusOnboard = await getOnboardingStatus();
      const submitRes = await postSubmitOnboarding();

      if (statusOnboard && statusOnboard?.can_submit === true) {
        if (submitRes.status === 'pending_verification') {
          navigate('/seller/application-sub');
        } else {
          const message = t('onboard.errors.submit_failed');
          setSubmitError(message);
          ErrToast(message);
        }
      } else {
        const next = submitRes.next_step;
        const message = `${t('onboard.errors.complete_fields')}: ${next}`;
        setSubmitError(message);
        ErrToast(message);
      }
    } catch (error) {
      const responseData = error?.response?.data;
      const messages = parseApiErrors(responseData);
      const message = messages.join('\n');
      setSubmitError(message);
      messages.forEach((msg) => ErrToast(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeEditSection = () => setEditingSectionId(null);

  const renderEditSection = (sectionId) => {
    switch (sectionId) {
      case COMPANY_REVIEW_SECTION_IDS.representative:
        return <Representative onClosePreview={closeEditSection} formik={formik} />;
      case COMPANY_REVIEW_SECTION_IDS.company:
        return <CompanyInfoEdit onClosePreview={closeEditSection} formik={formik} />;
      case COMPANY_REVIEW_SECTION_IDS.address:
        return <CompanyAddress onClosePreview={closeEditSection} formik={formik} />;
      case COMPANY_REVIEW_SECTION_IDS.bank:
        return <BankAccountEdit onClosePreview={closeEditSection} formik={formik} />;
      case COMPANY_REVIEW_SECTION_IDS.warehouse:
        return (
          <>
            <WhareHouseAddress formik={formik} />
            <ReturnAddress formik={formik} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SellerOnboardingLayout contentClassName="max-w-3xl">
      <CompanyReviewView
        title={t('onboard.review.title')}
        description={t('onboard.review.desc')}
        step={5}
        totalSteps={6}
        stepLabel={t('reg.step_label')}
        sections={sections}
        editingSectionId={editingSectionId}
        renderEditSection={renderEditSection}
        submitLabel={t('onboard.review.submit_btn')}
        submitError={submitError}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onEditSection={setEditingSectionId}
        editLabel={t('onboard.review.edit')}
      />
    </SellerOnboardingLayout>
  );
};

export default SellerReviewCompany;
