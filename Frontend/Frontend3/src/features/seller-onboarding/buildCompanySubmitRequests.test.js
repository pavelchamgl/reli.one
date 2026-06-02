import { describe, it, expect, vi, beforeEach } from 'vitest';

import { buildCompanySubmitRequests } from './buildCompanySubmitRequests';

vi.mock('@/api/seller/onboarding', () => ({
  putCompanyInfo: vi.fn(() => Promise.resolve({})),
  putRepresentative: vi.fn(() => Promise.resolve({})),
  putCompanyAddress: vi.fn(() => Promise.resolve({})),
  putOnboardingBank: vi.fn(() => Promise.resolve({})),
  putWarehouse: vi.fn(() => Promise.resolve({})),
  putReturnAddress: vi.fn(() => Promise.resolve({})),
}));

import {
  putCompanyInfo,
  putWarehouse,
  putReturnAddress,
} from '@/api/seller/onboarding';

const baseValues = {
  company_name: 'Acme',
  legal_form: 's.r.o.',
  country_of_registration: 'cz',
  business_id: '123',
  tin: 'CZ123',
  eori_number: '',
  company_phone: '+4201',
  certificate_issue_date: '',
  first_name: 'Jan',
  last_name: 'Novak',
  role: 'Director',
  date_of_birth: '01.01.1990',
  nationality: 'cz',
  street: 'S',
  city: 'C',
  zip_code: '1',
  country: 'cz',
  proof_document_issue_date: '',
  iban: 'CZ00',
  swift_bic: 'FIOBCZPP',
  account_holder: 'Acme',
  bank_code: '',
  local_account_number: '',
  wStreet: 'W',
  wCity: 'WC',
  wZip_code: '2',
  wCountry: 'cz',
  contact_phone: '+4202',
  same_as_the_primary_address: false,
  wProof_document_issue_date: '',
  same_as_warehouse: true,
  rStreet: 'R',
  rCity: 'RC',
  rZip_code: '3',
  rCountry: 'cz',
  rContact_phone: '+4203',
  rProof_document_issue_date: '',
};

describe('buildCompanySubmitRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns six labeled PUT blocks', () => {
    const requests = buildCompanySubmitRequests(baseValues);
    expect(requests).toHaveLength(6);
    expect(requests.map((r) => r.name)).toContain('Return Address');
  });

  it('does not send ico in company info payload', async () => {
    const requests = buildCompanySubmitRequests({ ...baseValues, ico: '12345678' });
    await requests[0].promise;
    expect(putCompanyInfo).toHaveBeenCalledWith(
      expect.not.objectContaining({ ico: expect.anything() }),
    );
  });

  it('omits empty proof_document_issue_date on return address', async () => {
    const requests = buildCompanySubmitRequests(baseValues);
    await requests[5].promise;
    expect(putReturnAddress).toHaveBeenCalledWith(
      expect.objectContaining({ same_as_warehouse: true }),
    );
    expect(putReturnAddress.mock.calls[0][0]).not.toHaveProperty('proof_document_issue_date');
  });

  it('uses form return proof date when provided', async () => {
    const requests = buildCompanySubmitRequests({
      ...baseValues,
      same_as_warehouse: false,
      rProof_document_issue_date: '15.01.2026',
    });
    await requests[5].promise;
    expect(putReturnAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        proof_document_issue_date: '2026-01-15',
      }),
    );
  });

  it('passes same-as-primary flag to warehouse payload', async () => {
    const requests = buildCompanySubmitRequests({
      ...baseValues,
      same_as_the_primary_address: true,
    });
    await requests[4].promise;
    expect(putWarehouse).toHaveBeenCalledWith(
      expect.objectContaining({
        same_as_primary_address: true,
      }),
    );
  });
});
