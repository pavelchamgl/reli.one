import { describe, expect, it } from 'vitest';

import { getAllCompanyDataBD, reducer } from './selfEmployed';

describe('selfEmployed reducer', () => {
  it('maps company warehouse same_as_primary_address for review edit form', () => {
    const action = getAllCompanyDataBD.fulfilled([
      { company_name: 'Reli Group s.r.o.', legal_form: 's.r.o. (Czech Republic / Slovakia)' },
      {},
      {},
      {},
      {
        same_as_primary_address: true,
        street: 'Na lysinách 551/34',
        city: 'Praha',
        zip_code: '14700',
        country: 'cz',
        contact_phone: '+420797837888',
      },
      { same_as_warehouse: true },
      [{}],
    ]);

    const state = reducer(undefined, action);

    expect(state.companyData.same_as_primary_address).toBe(true);
    expect(state.companyData.same_as_the_primary_address).toBe(true);
  });
});
