import accountInfoIc from '@/assets/Seller/register/accountInfoIc.svg';
import companyIc from '@/assets/Seller/register/companyIcon.svg';
import addressIc from '@/assets/Seller/register/addressIc.svg';
import bankIc from '@/assets/Seller/register/bankAcc.svg';
import warehouseIc from '@/assets/Seller/register/warehouseAndReturn.svg';
import { countriesArr } from '@/code/seller';

const countryLabel = (code) => countriesArr.find((item) => item.value === code)?.text ?? code ?? '';

export const COMPANY_REVIEW_SECTION_IDS = {
  representative: 'representative',
  company: 'company',
  address: 'address',
  bank: 'bank',
  warehouse: 'warehouse',
};

export function mapCompanyReviewSections({
  data,
  registerPhone,
  firstName,
  lastName,
  email,
  t,
}) {
  const countryOfRegistration = countryLabel(data?.country_of_registration);
  const addressCountry = countryLabel(data?.country);
  const warehouseCountry = countryLabel(data?.wCountry);
  const returnCountry = countryLabel(data?.rCountry);

  const identityDocuments = [];
  if (data?.front) {
    identityDocuments.push({
      label: identityDocuments.length === 0 ? t('onboard.review.identity_doc') : null,
      fileName: data.front,
    });
  }
  if (data?.back) {
    identityDocuments.push({
      label: identityDocuments.length === 0 ? t('onboard.review.identity_doc') : null,
      fileName: data.back,
    });
  }

  const warehouseBlocks = [
    {
      title: t('onboard.warehouse.title'),
      lines: [`${data?.wStreet}, ${data?.wCity}, ${warehouseCountry}, ${data?.wZip_code}`],
    },
    {
      title: t('onboard.warehouse.contact_phone'),
      lines: [data?.contact_phone],
      mono: true,
    },
  ];

  const returnBlocks = data?.same_as_warehouse
    ? [
        {
          title: t('onboard.return.title'),
          lines: [t('onboard.return.same_as_warehouse')],
        },
      ]
    : [
        {
          title: t('onboard.return.title'),
          lines: [`${data?.rStreet}, ${data?.rCity}, ${returnCountry}, ${data?.rZip_code}`],
        },
        {
          title: t('onboard.warehouse.contact_phone'),
          lines: [data?.rContact_phone],
        },
      ];

  const warehouseDocuments = [];
  if (data?.warehouse_name) {
    warehouseDocuments.push({
      label: t('onboard.tax_address.proof_address'),
      fileName: data.warehouse_name,
    });
  }
  if (data?.return_address_name) {
    warehouseDocuments.push({
      label: t('onboard.return.proof_address'),
      fileName: data.return_address_name,
    });
  }

  const companyRows = [
    { label: t('onboard.company.name'), value: data?.company_name },
    { label: t('onboard.company.legal_form'), value: data?.legal_form },
    { label: t('onboard.company.country_reg'), value: countryOfRegistration },
  ];

  if (data?.ico) {
    companyRows.push({ label: 'IČO', value: data.ico, mono: true });
  }
  if (data?.tin) {
    companyRows.push({ label: t('onboard.review.tin'), value: data.tin, mono: true });
  }
  if (data?.eori_number) {
    companyRows.push({ label: 'EORI', value: data.eori_number, mono: true });
  }

  companyRows.push(
    {
      label: t('onboard.company.reg_number'),
      value: registerPhone || 'N/A',
      mono: true,
    },
    { label: t('onboard.company.business_id'), value: data?.business_id, mono: true },
    {
      label: t('onboard.company.phone'),
      value: data?.company_phone || 'N/A',
      mono: true,
    }
  );

  const bankRows = [
    { label: t('onboard.bank.swift'), value: data?.swift_bic, mono: true },
    { label: t('onboard.bank.holder'), value: data?.account_holder, mono: true },
    { label: t('onboard.bank.iban'), value: data?.iban, mono: true },
  ];

  if (data?.bank_code) {
    bankRows.push({ label: t('onboard.bank.bank_code'), value: data.bank_code, mono: true });
  }
  if (data?.local_account_number) {
    bankRows.push({
      label: t('onboard.bank.local_acc'),
      value: data.local_account_number,
      mono: true,
    });
  }

  return [
    {
      id: COMPANY_REVIEW_SECTION_IDS.representative,
      iconSrc: accountInfoIc,
      title: t('onboard.review.representative'),
      rows: [
        { label: t('onboard.review.name'), value: `${firstName} ${lastName}`.trim() },
        { label: t('onboard.review.dob'), value: data?.date_of_birth, mono: true },
        { label: t('onboard.review.email'), value: email },
        { label: t('onboard.review.role'), value: data?.role },
        {
          label: t('onboard.review.phone'),
          value: data?.personal_phone || data?.company_phone,
          mono: true,
        },
        { label: t('onboard.review.seller_type'), value: t('onboard.review.type_company') },
      ],
      documents: identityDocuments,
    },
    {
      id: COMPANY_REVIEW_SECTION_IDS.company,
      iconSrc: companyIc,
      title: t('onboard.company.title'),
      rows: companyRows,
      documents: data?.company_file_date
        ? [{ label: t('onboard.company.cert_title'), fileName: data.company_file_date }]
        : [],
    },
    {
      id: COMPANY_REVIEW_SECTION_IDS.address,
      iconSrc: addressIc,
      title: t('onboard.tax_address.title_business'),
      rows: [
        { label: t('onboard.tax_address.street'), value: data?.street },
        { label: t('onboard.tax_address.city'), value: data?.city },
        { label: t('onboard.tax_address.zip'), value: data?.zip_code, mono: true },
        { label: t('onboard.tax_address.country'), value: addressCountry },
      ],
      documents: data?.company_address_name
        ? [{ label: t('onboard.tax_address.proof_address'), fileName: data.company_address_name }]
        : [],
    },
    {
      id: COMPANY_REVIEW_SECTION_IDS.bank,
      iconSrc: bankIc,
      title: t('onboard.bank.title'),
      rows: bankRows,
    },
    {
      id: COMPANY_REVIEW_SECTION_IDS.warehouse,
      iconSrc: warehouseIc,
      title: t('onboard.review.warehouse_return'),
      blocks: [...warehouseBlocks, ...returnBlocks],
      documents: warehouseDocuments,
    },
  ];
}
