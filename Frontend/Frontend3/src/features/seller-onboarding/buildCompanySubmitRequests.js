import {
  putCompanyAddress,
  putCompanyInfo,
  putOnboardingBank,
  putRepresentative,
  putReturnAddress,
  putWarehouse,
} from '@/api/seller/onboarding';
import { toISODate } from '@/code/seller';

/**
 * Builds labeled PUT promises for company onboarding submit (review + form).
 */
export function buildCompanySubmitRequests(values) {
  const certIso = toISODate(values.certificate_issue_date);
  const businessProofIso = toISODate(values.proof_document_issue_date);
  const warehouseProofIso = toISODate(values.wProof_document_issue_date);
  const returnProofIso = toISODate(values.rProof_document_issue_date);

  return [
    {
      name: 'Company Info',
      promise: putCompanyInfo({
        company_name: values.company_name,
        legal_form: values.legal_form,
        country_of_registration: values.country_of_registration,
        business_id: values.business_id,
        tin: values.tin,
        imports_to_eu: Boolean(values.eori_number),
        eori_number: values.eori_number || null,
        company_phone: values.company_phone,
        ...(certIso ? { certificate_issue_date: certIso } : {}),
      }),
    },
    {
      name: 'Representative',
      promise: putRepresentative({
        first_name: values.first_name,
        last_name: values.last_name,
        role: values.role,
        date_of_birth: values.date_of_birth?.split('.')?.reverse()?.join('-'),
        nationality: values.nationality,
      }),
    },
    {
      name: 'Company Address',
      promise: putCompanyAddress({
        street: values.street,
        city: values.city,
        zip_code: values.zip_code,
        country: values.country,
        ...(businessProofIso ? { proof_document_issue_date: businessProofIso } : {}),
      }),
    },
    {
      name: 'Bank Account',
      promise: putOnboardingBank({
        iban: values.iban,
        swift_bic: values.swift_bic,
        account_holder: values.account_holder,
        bank_code: values.bank_code,
        local_account_number: values.local_account_number,
      }),
    },
    {
      name: 'Warehouse',
      promise: putWarehouse({
        same_as_primary_address: Boolean(values.same_as_the_primary_address),
        street: values.wStreet,
        city: values.wCity,
        zip_code: values.wZip_code,
        country: values.wCountry,
        contact_phone: values.contact_phone,
        ...(warehouseProofIso ? { proof_document_issue_date: warehouseProofIso } : {}),
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
        ...(returnProofIso ? { proof_document_issue_date: returnProofIso } : {}),
      }),
    },
  ];
}
