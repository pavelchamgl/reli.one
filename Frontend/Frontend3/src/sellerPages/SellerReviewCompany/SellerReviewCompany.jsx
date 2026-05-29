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
} from '../../api/seller/onboarding';
import { ErrToast } from '../../ui/Toastify';
import { useActionSafeEmploed } from '../../hook/useActionSafeEmploed';
import { companyValidationSchema } from '../../code/seller/validation';
import {
  formatOnboardingRequestError,
  parseOnboardingApiErrors,
} from '@/features/seller-onboarding/parseOnboardingApiErrors';
import { buildCompanySubmitRequests } from '@/features/seller-onboarding/buildCompanySubmitRequests';
import {
  COMPANY_REVIEW_SECTION_IDS,
  mapCompanyReviewSections,
} from '@/features/seller-onboarding/mapCompanyReviewSections';

const SellerReviewCompany = () => {
  const { companyData } = useSelector((state) => state.selfEmploed);
  const { safeCompanyData, getAllCompanyDataBD } = useActionSafeEmploed();

  const firstName = JSON.parse(localStorage.getItem('first_name')) || '';
  const lastName = JSON.parse(localStorage.getItem('last_name')) || '';

  const formik = useFormik({
    initialValues: {
      company_name: companyData?.company_name ?? '',
      legal_form: companyData?.legal_form ?? '',
      country_of_registration: companyData?.country_of_registration ?? '',
      business_id: companyData?.business_id ?? '',
      tin: companyData?.tin ?? '',
      eori_number: companyData?.eori_number ?? '',
      company_phone: companyData?.company_phone ?? '',
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
        firstName,
        lastName,
        t,
      }),
    [companyData, firstName, lastName, t],
  );

  const handleSubmit = async () => {
    const values = formik.values;
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const validationErrors = await formik.validateForm();
      if (Object.keys(validationErrors).length > 0) {
        const message = t('onboard.errors.complete_fields');
        setSubmitError(message);
        ErrToast(message);
        return;
      }

      safeCompanyData({ ...values });
      localStorage.setItem('first_name', JSON.stringify(values.first_name));
      localStorage.setItem('last_name', JSON.stringify(values.last_name));

      const requests = buildCompanySubmitRequests(values);
      const results = await Promise.allSettled(requests.map((request) => request.promise));

      const errors = results
        .map((result, index) => {
          if (result.status === 'rejected') {
            const data = result.reason?.response?.data;
            return formatOnboardingRequestError(requests[index].name, data);
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

      if (statusOnboard?.can_submit === true) {
        const submitRes = await postSubmitOnboarding();
        if (submitRes.status === 'pending_verification') {
          navigate('/seller/application-sub');
        } else {
          const message = t('onboard.errors.submit_failed');
          setSubmitError(message);
          ErrToast(message);
        }
      } else {
        const next = statusOnboard?.next_step;
        const message = next
          ? `${t('onboard.errors.complete_fields')}: ${next}`
          : t('onboard.errors.complete_fields');
        setSubmitError(message);
        ErrToast(message);
      }
    } catch (error) {
      const responseData =
        error?.response?.data ?? (error?.message ? { message: error.message } : error);
      const messages = parseOnboardingApiErrors(responseData);
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
    <SellerOnboardingLayout>
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
