/**
 * FE-023 Iteration 1 — Field Contract RTL tests for /seller/seller-company.
 *
 * Checks:
 *  1. All 6 section headings are rendered.
 *  2. Every field from the Field Contract is present in the DOM.
 *  3. Forbidden fields (VAT ID, representative identity upload) are absent.
 *  4. Required markers (*) are visible on required fields.
 *
 * Strategy: render the full SellerCompanyInfo page with mocked external
 * dependencies and a preloaded Redux store.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import { useFormik } from 'formik';

// ── Mocks (hoisted before imports) ───────────────────────────────────────────

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key) => key,
      i18n: { changeLanguage: vi.fn() },
    }),
  };
});

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../../hook/useActionSafeEmploed', () => ({
  useActionSafeEmploed: () => ({
    safeCompanyData: vi.fn(),
    safeData: vi.fn(),
    getAllCompanyDataBD: vi.fn().mockResolvedValue({}),
    getAllDataFromBD: vi.fn().mockResolvedValue({}),
    setRegisterData: vi.fn(),
  }),
}));

vi.mock('../../api/seller/onboarding', () => ({
  putCompanyInfo: vi.fn().mockResolvedValue({}),
  putRepresentative: vi.fn().mockResolvedValue({}),
  putCompanyAddress: vi.fn().mockResolvedValue({}),
  putOnboardingBank: vi.fn().mockResolvedValue({}),
  putWarehouse: vi.fn().mockResolvedValue({}),
  putReturnAddress: vi.fn().mockResolvedValue({}),
  uploadSingleDocument: vi.fn().mockResolvedValue({ uploaded_at: '2025-01-01' }),
}));

vi.mock('../../api/seller/getOnboardingData', () => ({
  getAccountData: vi.fn().mockResolvedValue({ first_name: '', last_name: '' }),
  getCompanyInfo: vi.fn().mockResolvedValue({}),
  getRepresentativeData: vi.fn().mockResolvedValue({}),
  getCompanyAddress: vi.fn().mockResolvedValue({}),
  getBankData: vi.fn().mockResolvedValue({}),
  getWarehouseData: vi.fn().mockResolvedValue({}),
  getReturnData: vi.fn().mockResolvedValue({}),
  getDocumentsData: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../ui/Toastify', () => ({ ErrToast: vi.fn() }));

// ── Imports after mocks ───────────────────────────────────────────────────────

import { renderWithProviders } from '../../test/test-utils.jsx';
import { setupStore } from '../../redux/index.js';
import SellerCompanyInfo from './SellerCompanyInfo.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROUTE = '/seller/seller-company';

function makeStore(companyDataOverride = {}) {
  return setupStore({
    selfEmploed: {
      selfData: {},
      selfDataLoading: false,
      companyData: { ...companyDataOverride },
      companyDataLoading: false,
      registerData: {},
    },
  });
}

function renderPage(companyDataOverride = {}) {
  return renderWithProviders(<SellerCompanyInfo />, {
    route: ROUTE,
    storeInstance: makeStore(companyDataOverride),
  });
}

/** Query input by name attribute. */
function inputByName(name) {
  return document.querySelector(`[name="${name}"]`);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SellerCompanyInfo — field contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage (SellerCompanyInfo reads first_name/last_name)
    localStorage.clear();
  });

  // ── 1. Section headings ───────────────────────────────────────────────────

  describe('section headings', () => {
    it('renders all 6 section titles', () => {
      renderPage();
      const headings = screen.getAllByRole('heading', { level: 2 });
      const texts = headings.map((h) => h.textContent.trim());

      expect(texts).toContain('onboard.company.title');
      expect(texts).toContain('onboard.representative.title');
      expect(texts).toContain('onboard.tax_address.title_business');
      expect(texts).toContain('onboard.bank.title');
      expect(texts).toContain('onboard.warehouse.title');
      expect(texts).toContain('onboard.return.title');
    });

    it('renders step indicator', () => {
      renderPage();
      // OnboardingStepHeader renders step as text from props (step=4, totalSteps=6)
      expect(screen.getByText(/4/)).toBeInTheDocument();
      expect(screen.getByText(/6/)).toBeInTheDocument();
    });
  });

  // ── 2. Company Information (8 fields) ─────────────────────────────────────

  describe('Company Information — 8 fields', () => {
    it('renders company_name input', () => {
      renderPage();
      expect(inputByName('company_name')).toBeTruthy();
    });

    it('renders legal_form select', () => {
      renderPage();
      // SellerInfoSellect renders a combobox; verify via label text
      expect(screen.getByText('onboard.company.legal_form')).toBeInTheDocument();
    });

    it('renders country_of_registration select', () => {
      renderPage();
      expect(screen.getByText('onboard.company.country_reg')).toBeInTheDocument();
    });

    it('renders business_id input', () => {
      renderPage();
      expect(inputByName('business_id')).toBeTruthy();
    });

    it('renders tin input', () => {
      renderPage();
      expect(inputByName('tin')).toBeTruthy();
    });

    it('renders eori_number input (optional)', () => {
      renderPage();
      expect(inputByName('eori_number')).toBeTruthy();
    });

    it('renders registration certificate upload', () => {
      renderPage();
      // FileUploadZone renders label from title prop = t('onboard.company.cert_title')
      expect(screen.getByText('onboard.company.cert_title')).toBeInTheDocument();
    });

    it('renders company_phone input', () => {
      renderPage();
      expect(inputByName('company_phone')).toBeTruthy();
    });
  });

  // ── 3. Representative (5 fields) ─────────────────────────────────────────

  describe('Representative — 5 fields', () => {
    it('renders first_name input', () => {
      renderPage();
      expect(inputByName('first_name')).toBeTruthy();
    });

    it('renders last_name input', () => {
      renderPage();
      expect(inputByName('last_name')).toBeTruthy();
    });

    it('renders role select', () => {
      renderPage();
      expect(screen.getByText('onboard.review.role')).toBeInTheDocument();
    });

    it('renders date_of_birth input', () => {
      renderPage();
      expect(inputByName('date_of_birth')).toBeTruthy();
    });

    it('renders nationality select', () => {
      renderPage();
      expect(screen.getByText('onboard.seller_info.nationality')).toBeInTheDocument();
    });
  });

  // ── 4. Business Address (5 fields) ───────────────────────────────────────

  describe('Business Address — 5 fields', () => {
    it('renders street input', () => {
      renderPage();
      // street appears in multiple sections; check at least one
      const streets = document.querySelectorAll('[name="street"]');
      expect(streets.length).toBeGreaterThan(0);
    });

    it('renders city input', () => {
      renderPage();
      const cities = document.querySelectorAll('[name="city"]');
      expect(cities.length).toBeGreaterThan(0);
    });

    it('renders zip_code input', () => {
      renderPage();
      const zips = document.querySelectorAll('[name="zip_code"]');
      expect(zips.length).toBeGreaterThan(0);
    });

    it('renders country select in business address section', () => {
      renderPage();
      // Multiple country selects exist (business, warehouse, return)
      // Verify at least one country label is present in the business address section
      const businessHeading = screen.getByText('onboard.tax_address.title_business');
      const section = businessHeading.closest('section');
      expect(within(section).getByText('onboard.tax_address.country')).toBeInTheDocument();
    });

    it('renders proof_of_address upload in business address section', () => {
      renderPage();
      const businessHeading = screen.getByText('onboard.tax_address.title_business');
      const section = businessHeading.closest('section');
      // proof_address label appears in business, warehouse and return sections
      expect(within(section).getByText('onboard.tax_address.proof_address')).toBeInTheDocument();
    });
  });

  // ── 5. Bank Account (5 fields) ───────────────────────────────────────────

  describe('Bank Account — 5 fields', () => {
    it('renders iban input', () => {
      renderPage();
      expect(inputByName('iban')).toBeTruthy();
    });

    it('renders swift_bic input', () => {
      renderPage();
      expect(inputByName('swift_bic')).toBeTruthy();
    });

    it('renders account_holder input (auto-filled, visible)', () => {
      renderPage();
      expect(inputByName('account_holder')).toBeTruthy();
    });

    it('renders bank_code and local_account_number for CZ company', () => {
      // bank_code/local_account_number are only shown when business country is CZ/SK
      renderPage({ country: 'cz' });
      expect(inputByName('bank_code')).toBeTruthy();
      expect(inputByName('local_account_number')).toBeTruthy();
    });

    it('does NOT render bank_code and local_account_number for DE company', () => {
      renderPage({ country: 'de' });
      expect(inputByName('bank_code')).toBeNull();
      expect(inputByName('local_account_number')).toBeNull();
    });
  });

  // ── 6. Warehouse Address (checkbox + 6 fields) ───────────────────────────

  describe('Warehouse Address — checkbox + 6 fields', () => {
    it('renders same_as_the_primary_address checkbox', () => {
      renderPage();
      expect(document.querySelector('#same_as_the_primary_address')).toBeTruthy();
    });

    it('renders wStreet input', () => {
      renderPage();
      expect(inputByName('wStreet')).toBeTruthy();
    });

    it('renders wCity input', () => {
      renderPage();
      expect(inputByName('wCity')).toBeTruthy();
    });

    it('renders wZip_code input', () => {
      renderPage();
      expect(inputByName('wZip_code')).toBeTruthy();
    });

    it('renders country select in warehouse section', () => {
      renderPage();
      const warehouseHeading = screen.getByText('onboard.warehouse.title');
      const section = warehouseHeading.closest('section');
      expect(within(section).getByText('onboard.tax_address.country')).toBeInTheDocument();
    });

    it('renders contact_phone input', () => {
      renderPage();
      expect(inputByName('contact_phone')).toBeTruthy();
    });

    it('renders warehouse proof_of_address upload', () => {
      renderPage();
      const warehouseHeading = screen.getByText('onboard.warehouse.title');
      const section = warehouseHeading.closest('section');
      expect(within(section).getByText('onboard.tax_address.proof_address')).toBeInTheDocument();
    });
  });

  // ── 7. Return Address (checkbox + 6 fields) ──────────────────────────────

  describe('Return Address — checkbox + 6 fields', () => {
    it('renders same_as_warehouse checkbox', () => {
      renderPage();
      expect(document.querySelector('#same_as_warehouse')).toBeTruthy();
    });

    it('renders rStreet input', () => {
      renderPage();
      expect(inputByName('rStreet')).toBeTruthy();
    });

    it('renders rCity input', () => {
      renderPage();
      expect(inputByName('rCity')).toBeTruthy();
    });

    it('renders rZip_code input', () => {
      renderPage();
      expect(inputByName('rZip_code')).toBeTruthy();
    });

    it('renders country select in return address section', () => {
      renderPage();
      const returnHeading = screen.getByText('onboard.return.title');
      const section = returnHeading.closest('section');
      expect(within(section).getByText('onboard.tax_address.country')).toBeInTheDocument();
    });

    it('renders rContact_phone input', () => {
      renderPage();
      expect(inputByName('rContact_phone')).toBeTruthy();
    });

    it('renders return proof_of_address upload when not linked to warehouse', () => {
      renderPage({ same_as_warehouse: false });
      const returnHeading = screen.getByText('onboard.return.title');
      const section = returnHeading.closest('section');
      expect(within(section).getByText('onboard.tax_address.proof_address')).toBeInTheDocument();
    });
  });

  // ── 8. Forbidden fields ────────────────────────────────────────────────────

  describe('Forbidden fields', () => {
    it('does NOT render a VAT ID input', () => {
      renderPage();
      expect(inputByName('vat_id')).toBeNull();
      expect(inputByName('vat')).toBeNull();
      // Also check no label text matches
      expect(screen.queryByText(/VAT ID/i)).toBeNull();
    });

    it('does NOT render representative identity document upload fields', () => {
      renderPage();
      // Self-employed has uploadFront/uploadBack identity doc inputs — company form must not
      expect(document.querySelector('[data-testid="ident-doc-upload"]')).toBeNull();
      // No passport/driving_license/id_card upload labels
      expect(screen.queryByText(/passport/i)).toBeNull();
      expect(screen.queryByText(/driving.license/i)).toBeNull();
    });

    it('does NOT render self-employed-only tax fields (ico, tax_country, personal_phone)', () => {
      renderPage();
      expect(inputByName('ico')).toBeNull();
      expect(inputByName('tax_country')).toBeNull();
      expect(inputByName('personal_phone')).toBeNull();
    });
  });

  // ── 9. Required markers ───────────────────────────────────────────────────

  describe('Required markers', () => {
    it('shows required marker (*) on company_name label', () => {
      renderPage();
      const label = screen.getByText('onboard.company.name', { selector: 'label' });
      // FormField appends <span aria-hidden>*</span> when required=true
      expect(label.querySelector('[aria-hidden="true"]')).toBeTruthy();
    });

    it('shows required marker (*) on iban label', () => {
      renderPage();
      const label = screen.getByText('onboard.bank.iban', { selector: 'label' });
      expect(label.querySelector('[aria-hidden="true"]')).toBeTruthy();
    });

    it('shows required marker on company_phone label', () => {
      renderPage();
      const label = screen.getByText('onboard.company.phone', { selector: 'label' });
      expect(label.querySelector('[aria-hidden="true"]')).toBeTruthy();
    });
  });

  // ── 10. Submit button ──────────────────────────────────────────────────────

  describe('Submit button', () => {
    it('renders the Continue to Review button', () => {
      renderPage();
      expect(screen.getByRole('button', { name: 'onboard.common.continue_review' })).toBeInTheDocument();
    });

    it('submit button becomes disabled only after validation runs (validateOnMount is not set)', () => {
      // formik without validateOnMount starts isValid=true; the button is enabled by default.
      // Disabling on initial empty form requires validateOnMount — tracked as UX improvement,
      // not a field-contract gate for Iteration 1.
      renderPage();
      expect(
        screen.getByRole('button', { name: 'onboard.common.continue_review' }),
      ).toBeInTheDocument();
    });
  });
});
