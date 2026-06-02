/**
 * FE-023 Iteration 1 — Field Contract: Yup schema assertions.
 *
 * These tests lock the companyValidationSchema so that:
 *  - TIN is required for ALL countries (not just CZ/SK) — F2
 *  - wCountry is required — F1
 *  - rCountry is required — F1
 *
 * The tests intentionally FAIL on the current schema and PASS after the fix.
 */

import { describe, it, expect } from 'vitest';
import { companyValidationSchema } from './validation';

/** Minimal valid payload that covers all required fields. */
function validPayload(overrides = {}) {
  return {
    // Company Information
    company_name: 'Acme GmbH',
    legal_form: 'GmbH (Germany)',
    country_of_registration: 'DE',
    business_id: 'HRB12345',
    tin: 'DE123456789',
    eori_number: null,   // optional — blank maps to null
    company_phone: '+4915123456789',
    // Simulates a successful upload (set by uploadSingleDocument response).
    certificate_issue_date: '2025-01-15T10:00:00Z',

    // Representative
    first_name: 'Jane',
    last_name: 'Smith',
    role: 'Director',
    date_of_birth: '01.01.1990',
    nationality: 'DE',

    // Business Address
    street: 'Main St 1',
    city: 'Berlin',
    zip_code: '10115',
    country: 'DE',
    proof_document_issue_date: '2025-01-16T10:00:00Z',

    // Bank Account
    iban: 'DE89370400440532013000',
    swift_bic: 'COBADEFFXXX',
    account_holder: 'Acme GmbH',
    bank_code: '',
    local_account_number: '',

    // Warehouse Address
    same_as_the_primary_address: false,
    wStreet: 'Warehouse St 2',
    wCity: 'Munich',
    wZip_code: '80331',
    wCountry: 'DE',
    contact_phone: '+4915123456780',
    wProof_document_issue_date: '2025-01-17T10:00:00Z',

    // Return Address
    same_as_warehouse: false,
    rStreet: 'Return St 3',
    rCity: 'Hamburg',
    rZip_code: '20095',
    rCountry: 'DE',
    rContact_phone: '+4915123456781',
    rProof_document_issue_date: '2025-01-18T10:00:00Z',

    ...overrides,
  };
}

async function expectValid(payload) {
  await expect(
    companyValidationSchema.validate(payload, { abortEarly: false }),
  ).resolves.toBeDefined();
}

async function expectInvalidContaining(payload, errorSubstring) {
  const result = await companyValidationSchema
    .validate(payload, { abortEarly: false })
    .catch((err) => err);

  expect(result?.errors, `Expected validation to fail with "${errorSubstring}"`).toBeDefined();
  const found = result.errors?.some((e) =>
    e.toLowerCase().includes(errorSubstring.toLowerCase()),
  );
  expect(found, `Expected error containing "${errorSubstring}", got: ${JSON.stringify(result.errors)}`).toBe(true);
}

// ─────────────────────────────────────────────────────────────────────────────

describe('companyValidationSchema', () => {
  it('passes for a fully-valid DE company payload', async () => {
    await expectValid(validPayload());
  });

  it('passes for a fully-valid CZ company payload', async () => {
    await expectValid(
      validPayload({
        country_of_registration: 'cz',
        tin: 'CZ12345678',
        wCountry: 'cz',
        rCountry: 'cz',
      }),
    );
  });

  // ── F2: TIN must be required for ALL countries ──────────────────────────────

  describe('F2 — TIN required for all countries (not only CZ/SK)', () => {
    it('rejects missing TIN for a German company', async () => {
      await expectInvalidContaining(validPayload({ tin: '' }), 'tin');
    });

    it('rejects missing TIN for a French company', async () => {
      await expectInvalidContaining(
        validPayload({ country_of_registration: 'FR', tin: '' }),
        'tin',
      );
    });

    it('rejects missing TIN for a Czech company', async () => {
      await expectInvalidContaining(
        validPayload({ country_of_registration: 'cz', tin: '' }),
        'tin',
      );
    });
  });

  // ── F1: wCountry must be required ──────────────────────────────────────────

  describe('F1 — wCountry required', () => {
    it('rejects missing warehouse country', async () => {
      await expectInvalidContaining(validPayload({ wCountry: '' }), 'warehouse country');
    });

    it('rejects null warehouse country', async () => {
      await expectInvalidContaining(validPayload({ wCountry: null }), 'warehouse country');
    });
  });

  // ── F1: rCountry must be required ──────────────────────────────────────────

  describe('F1 — rCountry required', () => {
    it('rejects missing return country', async () => {
      await expectInvalidContaining(validPayload({ rCountry: '' }), 'return country');
    });

    it('rejects null return country', async () => {
      await expectInvalidContaining(validPayload({ rCountry: null }), 'return country');
    });
  });

  // ── F4: Upload proxy fields must be required ───────────────────────────────

  describe('F4 — upload date fields required', () => {
    it('rejects missing registration certificate upload', async () => {
      await expectInvalidContaining(
        validPayload({ certificate_issue_date: '' }),
        'registration certificate',
      );
    });

    it('rejects missing business address proof upload', async () => {
      await expectInvalidContaining(
        validPayload({ proof_document_issue_date: '' }),
        'business address proof',
      );
    });

    it('requires warehouse proof upload when same-as-primary is false', async () => {
      await expectInvalidContaining(
        validPayload({ same_as_the_primary_address: false, wProof_document_issue_date: '' }),
        'warehouse proof',
      );
    });

    it('accepts empty warehouse proof upload when same-as-primary is true', async () => {
      await expectValid(
        validPayload({ same_as_the_primary_address: true, wProof_document_issue_date: '' }),
      );
    });

    it('rejects missing return address proof when same_as_warehouse is false', async () => {
      await expectInvalidContaining(
        validPayload({ same_as_warehouse: false, rProof_document_issue_date: '' }),
        'return address proof',
      );
    });

    it('accepts empty return address proof when same_as_warehouse is true', async () => {
      await expectValid(
        validPayload({ same_as_warehouse: true, rProof_document_issue_date: '' }),
      );
    });
  });

  // ── Existing required fields still enforced ────────────────────────────────

  describe('existing required fields remain enforced', () => {
    it('rejects missing company_name', async () => {
      await expectInvalidContaining(validPayload({ company_name: '' }), 'company name');
    });

    it('rejects missing iban', async () => {
      await expectInvalidContaining(validPayload({ iban: '' }), 'iban');
    });

    it('rejects missing wStreet', async () => {
      await expectInvalidContaining(validPayload({ wStreet: '' }), 'warehouse street');
    });

    it('rejects missing rStreet', async () => {
      await expectInvalidContaining(validPayload({ rStreet: '' }), 'return street');
    });
  });
});
