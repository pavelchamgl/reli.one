import { describe, it, expect, vi } from 'vitest';

import {
  COMPANY_REVIEW_SECTION_IDS,
  mapCompanyReviewSections,
} from './mapCompanyReviewSections';

const t = (key) => key;

const fullCompanyData = {
  company_name: 'Acme s.r.o.',
  legal_form: 's.r.o.',
  country_of_registration: 'cz',
  business_id: '12345678',
  tin: 'CZ12345678',
  eori_number: 'CZ1234567890123',
  company_phone: '+420123456789',
  company_file_date: 'cert.pdf',
  role: 'Director',
  date_of_birth: '01.01.1990',
  nationality: 'cz',
  street: 'Main 1',
  city: 'Prague',
  zip_code: '11000',
  country: 'cz',
  company_address_name: 'proof.pdf',
  iban: 'CZ6508000000192000145399',
  swift_bic: 'FIOBCZPP',
  account_holder: 'Acme s.r.o.',
  bank_code: '0800',
  local_account_number: '1234567890',
  wStreet: 'Warehouse 2',
  wCity: 'Brno',
  wZip_code: '60200',
  wCountry: 'cz',
  contact_phone: '+420987654321',
  warehouse_name: 'warehouse-proof.pdf',
  same_as_warehouse: false,
  rStreet: 'Return 3',
  rCity: 'Ostrava',
  rZip_code: '70030',
  rCountry: 'cz',
  rContact_phone: '+420111222333',
  return_address_name: 'return-proof.pdf',
  front: 'id-front.pdf',
  back: 'id-back.pdf',
  ico: '12345678',
};

describe('mapCompanyReviewSections', () => {
  it('maps five company review sections', () => {
    const sections = mapCompanyReviewSections({
      data: fullCompanyData,
      firstName: 'Jan',
      lastName: 'Novak',
      t,
    });

    expect(sections).toHaveLength(5);
    expect(sections.map((s) => s.id)).toEqual([
      COMPANY_REVIEW_SECTION_IDS.representative,
      COMPANY_REVIEW_SECTION_IDS.company,
      COMPANY_REVIEW_SECTION_IDS.address,
      COMPANY_REVIEW_SECTION_IDS.bank,
      COMPANY_REVIEW_SECTION_IDS.warehouse,
    ]);
  });

  it('shows field contract rows for representative without identity documents', () => {
    const [representative] = mapCompanyReviewSections({
      data: fullCompanyData,
      firstName: 'Jan',
      lastName: 'Novak',
      t,
    });

    expect(representative.documents).toEqual([]);
    expect(representative.rows.map((r) => r.label)).toEqual([
      'onboard.reg.first_name',
      'onboard.reg.last_name',
      'onboard.review.role',
      'onboard.review.dob',
      'onboard.seller_info.nationality',
    ]);
    expect(representative.rows.some((r) => r.label === 'onboard.review.identity_doc')).toBe(
      false,
    );
  });

  it('does not expose self-employed-only company fields', () => {
    const [, company] = mapCompanyReviewSections({
      data: fullCompanyData,
      firstName: 'Jan',
      lastName: 'Novak',
      t,
    });

    expect(company.rows.some((r) => r.label === 'IČO')).toBe(false);
    expect(company.rows.some((r) => r.value === '+420111222333')).toBe(false);
  });

  it('includes registration and business proof documents', () => {
    const sections = mapCompanyReviewSections({
      data: fullCompanyData,
      firstName: 'Jan',
      lastName: 'Novak',
      t,
    });

    expect(sections[1].documents[0].fileName).toBe('cert.pdf');
    expect(sections[2].documents[0].fileName).toBe('proof.pdf');
  });

  it('shows CZ/SK bank fields when country of registration is cz', () => {
    const [, , , bank] = mapCompanyReviewSections({
      data: fullCompanyData,
      firstName: 'Jan',
      lastName: 'Novak',
      t,
    });

    expect(bank.rows.some((r) => r.label === 'onboard.bank.bank_code')).toBe(true);
    expect(bank.rows.some((r) => r.label === 'onboard.bank.local_acc')).toBe(true);
  });

  it('shows same_as_warehouse summary when linked', () => {
    const [, , , , warehouse] = mapCompanyReviewSections({
      data: { ...fullCompanyData, same_as_warehouse: true },
      firstName: 'Jan',
      lastName: 'Novak',
      t,
    });

    expect(
      warehouse.blocks?.some((block) =>
        block.lines?.includes('onboard.return.same_as_warehouse'),
      ),
    ).toBe(true);
    expect(warehouse.documents.some((d) => d.fileName === 'return-proof.pdf')).toBe(false);
  });
});
