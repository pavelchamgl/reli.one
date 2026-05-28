import { describe, it, expect, vi } from 'vitest';

import {
  COMPANY_REVIEW_SECTION_IDS,
  mapCompanyReviewSections,
} from './mapCompanyReviewSections';

const t = (key) => key;

describe('mapCompanyReviewSections', () => {
  it('maps company review sections with representative and company blocks', () => {
    const sections = mapCompanyReviewSections({
      data: {
        company_name: 'Acme s.r.o.',
        legal_form: 's.r.o.',
        country_of_registration: 'cz',
        role: 'Director',
        date_of_birth: '01.01.1990',
        company_phone: '+420123456789',
        street: 'Main 1',
        city: 'Prague',
        zip_code: '11000',
        country: 'cz',
        swift_bic: 'FIOBCZPP',
        account_holder: 'Acme s.r.o.',
        iban: 'CZ6508000000192000145399',
        wStreet: 'Warehouse 2',
        wCity: 'Brno',
        wZip_code: '60200',
        wCountry: 'cz',
        contact_phone: '+420987654321',
        same_as_warehouse: true,
      },
      registerPhone: '+420111222333',
      firstName: 'Jan',
      lastName: 'Novak',
      email: 'jan@acme.cz',
      t,
    });

    expect(sections).toHaveLength(5);
    expect(sections[0].id).toBe(COMPANY_REVIEW_SECTION_IDS.representative);
    expect(sections[0].title).toBe('onboard.review.representative');
    expect(sections[1].id).toBe(COMPANY_REVIEW_SECTION_IDS.company);
    expect(sections[1].rows.some((row) => row.value === 'Acme s.r.o.')).toBe(true);
    expect(sections[4].blocks?.some((block) => block.lines?.includes('onboard.return.same_as_warehouse'))).toBe(
      true
    );
  });
});
