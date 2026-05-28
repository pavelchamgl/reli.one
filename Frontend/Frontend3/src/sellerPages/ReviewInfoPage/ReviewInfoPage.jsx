import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';


import AddressBlock from '../../Components/Seller/auth/sellerInfo/address/AddressBlock';
import BankAccountEdit from '../../Components/Seller/auth/sellerInfo/BankAccount/BankAccount';
import PersonalEdit from '../../Components/Seller/auth/sellerInfo/PersonalDetails/PersonalDetails';
import ReturnAddress from '../../Components/Seller/auth/sellerInfo/ReturnAddress/ReturnAddress';
import TaxInfo from '../../Components/Seller/auth/sellerInfo/TaxInfo/TaxInfo';
import WhareHouseAddress from '../../Components/Seller/auth/sellerInfo/WareHouseAddress/WhareHouseAddress';
import { SellerOnboardingLayout } from '@/components/seller/onboarding';
import { SelfEmployedReviewView } from '@/components/seller/onboarding/views/review';
import {
  getOnboardingStatus,
  getReviewOnboarding,
  postSubmitOnboarding,
  putOnboardingBank,
  putPersonalData,
  putReturnAddress,
  putSelfAddress,
  putTax,
  putWarehouse,
} from '../../api/seller/onboarding';
import { ErrToast } from '../../ui/Toastify';
import { validationSchemaSelf } from '../../code/seller/validation';
import { toISODate } from '../../code/seller';
import { useActionSafeEmploed } from '../../hook/useActionSafeEmploed';
import {
  mapSelfEmployedReviewSections,
  SELF_EMPLOYED_REVIEW_SECTION_IDS,
} from '@/features/seller-onboarding/mapSelfEmployedReviewSections';

const ReviewInfoPage = () => {
  const { selfData } = useSelector((state) => state.selfEmploed);
  const firstName = JSON.parse(localStorage.getItem('first_name')) || '';
  const lastName = JSON.parse(localStorage.getItem('last_name')) || '';
  const phone = JSON.parse(localStorage.getItem('phone')) || '';
  const email = JSON.parse(localStorage.getItem('email')) || '';

  const formik = useFormik({
    initialValues: {
      first_name: firstName,
      last_name: lastName,
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
      wStreet: selfData?.wStreet ?? '',
      wCity: selfData?.wCity ?? '',
      wZip_code: selfData?.wZip_code ?? '',
      wCountry: selfData?.wCountry ?? '',
      contact_phone: selfData?.contact_phone ?? '',
      wProof_document_issue_date: selfData?.wProof_document_issue_date ?? '',
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
    onSubmit: async () => {},
  });

  const [editingSectionId, setEditingSectionId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { getAllDataFromBD } = useActionSafeEmploed();
  const navigate = useNavigate();
  const { t } = useTranslation('onbording');

  useEffect(() => {
    getReviewOnboarding();
    getAllDataFromBD();
  }, []);

  const sections = useMemo(
    () =>
      mapSelfEmployedReviewSections({
        data: selfData,
        firstName,
        lastName,
        email,
        phone,
        t,
      }),
    [selfData, firstName, lastName, email, phone, t]
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
          name: 'Personal Data',
          promise: putPersonalData({
            date_of_birth: values.date_of_birth?.split('.').reverse().join('-'),
            nationality: selfData.nationality,
            personal_phone: values.personal_phone,
          }),
        },
        {
          name: 'Tax Info',
          promise: putTax({
            tax_country: selfData.tax_country,
            tin: values.tin,
            ico:
              selfData.tax_country === 'cz' || selfData.tax_country === 'sk' ? '' : values.ico,
          }),
        },
        {
          name: 'Self Address',
          promise: putSelfAddress({
            street: values.street,
            city: values.city,
            zip_code: values.zip_code,
            country: selfData.country,
            proof_document_issue_date: toISODate(values.proof_document_issue_date),
          }),
        },
        {
          name: 'Bank Account',
          promise: putOnboardingBank({
            iban: selfData?.iban,
            swift_bic: selfData?.swift_bic,
            account_holder: selfData?.account_holder,
            bank_code: selfData?.bank_code,
            local_account_number: selfData?.local_account_number,
          }),
        },
        {
          name: 'Warehouse',
          promise: putWarehouse({
            same_as_the_primary_address: selfData.same_as_the_primary_address,
            street: values.wStreet,
            city: values.wCity,
            zip_code: values.wZip_code,
            country: selfData.wCountry,
            contact_phone: values.contact_phone,
            proof_document_issue_date: toISODate(values.wProof_document_issue_date),
          }),
        },
        {
          name: 'Return Address',
          promise: putReturnAddress({
            same_as_warehouse: selfData.same_as_warehouse,
            street: values.rStreet,
            city: values.rCity,
            zip_code: values.rZip_code,
            country: selfData.rCountry,
            contact_phone: values.rContact_phone,
            proof_document_issue_date: toISODate(values.wProof_document_issue_date),
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

      if (statusOnboard && statusOnboard?.can_submit === true) {
        const submitRes = await postSubmitOnboarding();
        if (submitRes.status === 'pending_verification') {
          navigate('/seller/application-sub');
        } else {
          const message = t('onboard.review.err_submit');
          setSubmitError(message);
          ErrToast(message);
        }
      } else {
        const message = t('onboard.review.err_incomplete');
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
      case SELF_EMPLOYED_REVIEW_SECTION_IDS.account:
        return <PersonalEdit onClosePreview={closeEditSection} formik={formik} />;
      case SELF_EMPLOYED_REVIEW_SECTION_IDS.tax:
        return <TaxInfo formik={formik} onClosePreview={closeEditSection} />;
      case SELF_EMPLOYED_REVIEW_SECTION_IDS.address:
        return <AddressBlock onClosePreview={closeEditSection} formik={formik} />;
      case SELF_EMPLOYED_REVIEW_SECTION_IDS.bank:
        return <BankAccountEdit onClosePreview={closeEditSection} formik={formik} />;
      case SELF_EMPLOYED_REVIEW_SECTION_IDS.warehouse:
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
      <SelfEmployedReviewView
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

export default ReviewInfoPage;
