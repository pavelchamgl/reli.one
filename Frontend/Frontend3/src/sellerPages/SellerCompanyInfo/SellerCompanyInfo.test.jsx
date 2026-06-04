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
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormik } from 'formik';

// ── Mocks (hoisted before imports) ───────────────────────────────────────────

const i18nMocks = vi.hoisted(() => ({
  language: 'keys',
  translations: {
    cz: {
      'onboard.company.business_id': 'IČO',
      'onboard.company.ares.load': 'Načíst z ARES',
      'onboard.company.ares.errors.invalid': 'Před načtením z ARES zadejte platné české IČO.',
    },
  },
}));

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key) => i18nMocks.translations[i18nMocks.language]?.[key] ?? key,
      i18n: {
        changeLanguage: vi.fn((language) => {
          i18nMocks.language = language;
        }),
      },
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
  getAresCompanyByIco: vi.fn(),
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
import SellerCompanyInfo, { COMPANY_ARES_ENTRY_ASSIST_STORAGE_KEY } from './SellerCompanyInfo.jsx';
import { getAresCompanyByIco, putCompanyInfo, putOnboardingBank } from '../../api/seller/onboarding';

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

function renderPage(companyDataOverride = {}, options = {}) {
  if (options.dismissAssist !== false) {
    localStorage.setItem(COMPANY_ARES_ENTRY_ASSIST_STORAGE_KEY, 'test-dismissed');
  } else {
    localStorage.removeItem(COMPANY_ARES_ENTRY_ASSIST_STORAGE_KEY);
  }

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
    i18nMocks.language = 'keys';
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

  describe('Company onboarding entry ARES assist modal', () => {
    const modalAresSuccess = {
      found: true,
      ico: '25596641',
      business_id: '25596641',
      company_name: 'Entry Assist s.r.o.',
      legal_form_code: '112',
      legal_form: 's.r.o. (Czech Republic / Slovakia)',
      registered_address: {
        street: 'Dlouhá 12',
        city: 'Praha',
        zip_code: '11000',
        country: 'CZ',
      },
      dic_hint: 'CZ25596641',
      dic_hint_source: 'ares',
      is_active: false,
      warnings: [],
    };

    async function openEntryAssist(companyData = {}) {
      renderPage(companyData, { dismissAssist: false });
      return screen.findByTestId('company-ares-entry-modal');
    }

    async function lookupInEntryAssist(ico = '25596641') {
      const user = userEvent.setup();
      const modal = await openEntryAssist();
      await user.type(within(modal).getByRole('textbox', { name: 'onboard.company.business_id' }), ico);
      await user.click(within(modal).getByRole('button', { name: 'onboard.company.ares_entry.load' }));
      return { user, modal };
    }

    it('modal appears on empty company onboarding', async () => {
      const modal = await openEntryAssist();

      expect(modal).toBeInTheDocument();
      expect(within(modal).getByText('onboard.company.ares_entry.description')).toBeInTheDocument();
      expect(within(modal).getByText('onboard.company.ares_entry.scope_note')).toBeInTheDocument();
      expect(within(modal).getByRole('button', { name: 'onboard.company.ares_entry.manual' })).toBeInTheDocument();
    });

    it('modal does not appear when company legal data exists', async () => {
      renderPage({ company_name: 'Existing s.r.o.' }, { dismissAssist: false });

      await waitFor(() => {
        expect(screen.queryByTestId('company-ares-entry-modal')).not.toBeInTheDocument();
      });
    });

    it('Fill manually closes modal and does not mutate form', async () => {
      const user = userEvent.setup();
      const modal = await openEntryAssist();

      await user.click(within(modal).getByRole('button', { name: 'onboard.company.ares_entry.manual' }));

      await waitFor(() => {
        expect(screen.queryByTestId('company-ares-entry-modal')).not.toBeInTheDocument();
      });
      expect(localStorage.getItem(COMPANY_ARES_ENTRY_ASSIST_STORAGE_KEY)).toBe('manual');
      expect(inputByName('company_name')).toHaveValue('');
      expect(inputByName('business_id')).toHaveValue('');
      expect(inputByName('tin')).toHaveValue('');
    });

    it('success lookup renders compact preview', async () => {
      getAresCompanyByIco.mockResolvedValueOnce(modalAresSuccess);

      const { modal } = await lookupInEntryAssist();

      expect(await within(modal).findByTestId('company-ares-entry-preview')).toBeInTheDocument();
      expect(within(modal).getByText('Entry Assist s.r.o.')).toBeInTheDocument();
      expect(within(modal).getByText('25596641')).toBeInTheDocument();
      expect(within(modal).getByText('s.r.o. (Czech Republic / Slovakia)')).toBeInTheDocument();
      expect(within(modal).getByText('Dlouhá 12, Praha, 11000, CZ')).toBeInTheDocument();
      expect(within(modal).getByText('CZ25596641')).toBeInTheDocument();
      expect(within(modal).getByText('onboard.company.ares.inactive_warning')).toBeInTheDocument();
    });

    it('Apply fills legal company fields and closes modal', async () => {
      getAresCompanyByIco.mockResolvedValueOnce(modalAresSuccess);

      const { user, modal } = await lookupInEntryAssist();
      await within(modal).findByTestId('company-ares-entry-preview');
      await user.click(within(modal).getByRole('button', { name: 'onboard.company.ares_entry.apply' }));

      await waitFor(() => expect(screen.queryByTestId('company-ares-entry-modal')).not.toBeInTheDocument());
      expect(localStorage.getItem(COMPANY_ARES_ENTRY_ASSIST_STORAGE_KEY)).toBe('apply');
      expect(inputByName('company_name')).toHaveValue('Entry Assist s.r.o.');
      expect(inputByName('business_id')).toHaveValue('25596641');
      expect(inputByName('street')).toHaveValue('Dlouhá 12');
      expect(inputByName('city')).toHaveValue('Praha');
      expect(inputByName('zip_code')).toHaveValue('11000');
      expect(inputByName('tin')).toHaveValue('CZ25596641');
      expect(screen.getByText('onboard.legal_forms.sro')).toBeInTheDocument();
      expect(screen.getAllByText('countries.cz').length).toBeGreaterThanOrEqual(2);
    });

    it('Apply does not overwrite non-empty TIN', async () => {
      getAresCompanyByIco.mockResolvedValueOnce(modalAresSuccess);

      const { user, modal } = await lookupInEntryAssist();
      await user.type(inputByName('tin'), 'USER-TIN-123');
      await within(modal).findByTestId('company-ares-entry-preview');
      await user.click(within(modal).getByRole('button', { name: 'onboard.company.ares_entry.apply' }));

      expect(inputByName('tin')).toHaveValue('USER-TIN-123');
    });

    it('Apply does not fill phone, bank, warehouse or return fields', async () => {
      getAresCompanyByIco.mockResolvedValueOnce({
        ...modalAresSuccess,
        company_phone: '+420000000000',
        iban: 'CZ6508000000192000145399',
        wStreet: 'Warehouse from ARES',
        rStreet: 'Return from ARES',
      });

      const { user, modal } = await lookupInEntryAssist();
      await within(modal).findByTestId('company-ares-entry-preview');
      await user.click(within(modal).getByRole('button', { name: 'onboard.company.ares_entry.apply' }));

      expect(inputByName('company_phone')).toHaveValue('');
      expect(inputByName('iban')).toHaveValue('');
      expect(inputByName('wStreet')).toHaveValue('');
      expect(inputByName('rStreet')).toHaveValue('');
    });

    it('not found, invalid and unavailable errors keep manual mode available', async () => {
      const user = userEvent.setup();
      const modal = await openEntryAssist();
      await user.type(within(modal).getByRole('textbox', { name: 'onboard.company.business_id' }), '25596641');

      for (const errorCase of [
        { status: 404, code: 'ares_not_found', key: 'not_found' },
        { status: 400, code: 'ares_invalid_ico', key: 'invalid' },
        { status: 503, code: 'ares_unavailable', key: 'unavailable' },
      ]) {
        getAresCompanyByIco.mockRejectedValueOnce(errorCase);
        await user.click(within(modal).getByRole('button', { name: 'onboard.company.ares_entry.load' }));

        expect(await within(modal).findByRole('alert')).toHaveTextContent(`onboard.company.ares.errors.${errorCase.key}`);
        expect(within(modal).queryByRole('button', { name: 'onboard.company.ares_entry.apply' })).not.toBeInTheDocument();
        expect(within(modal).getByRole('button', { name: 'onboard.company.ares_entry.manual' })).toBeInTheDocument();
      }

      await user.click(within(modal).getByRole('button', { name: 'onboard.company.ares_entry.manual' }));
      await waitFor(() => expect(screen.queryByTestId('company-ares-entry-modal')).not.toBeInTheDocument());
    });
  });

  describe('ARES assisted prefill', () => {
    const aresSuccess = {
      found: true,
      ico: '25596641',
      business_id: '25596641',
      company_name: 'ARES Example s.r.o.',
      legal_form_code: '112',
      legal_form: 's.r.o. (Czech Republic / Slovakia)',
      registered_address: {
        street: 'Václavské náměstí 1',
        city: 'Praha',
        zip_code: '11000',
        country: 'CZ',
      },
      dic_hint: 'CZ25596641',
      dic_hint_source: 'ares',
      is_active: false,
      representatives: [
        {
          first_name: 'Jan',
          last_name: 'Novák',
          role_hint: 'Jednatel',
          birth_date_hint: '1990-01-01',
          nationality_hint: 'CZ',
        },
      ],
      warnings: [],
    };

    async function lookupFromAres(ico = '25596641') {
      const user = userEvent.setup();
      await user.type(inputByName('business_id'), ico);
      await user.click(screen.getByRole('button', { name: 'onboard.company.ares.load' }));
      return user;
    }

    it('lookup button calls backend API with IČO', async () => {
      getAresCompanyByIco.mockResolvedValueOnce(aresSuccess);
      renderPage();

      await lookupFromAres();

      await waitFor(() => expect(getAresCompanyByIco).toHaveBeenCalledWith('25596641'));
    });

    it('shows success preview without mutating form fields before Apply', async () => {
      getAresCompanyByIco.mockResolvedValueOnce(aresSuccess);
      renderPage();

      await lookupFromAres();

      expect(await screen.findByTestId('ares-preview')).toBeInTheDocument();
      expect(screen.getByText('ARES Example s.r.o.')).toBeInTheDocument();
      expect(screen.getByText('s.r.o. (Czech Republic / Slovakia)')).toBeInTheDocument();
      expect(screen.getByText('Václavské náměstí 1, Praha, 11000, CZ')).toBeInTheDocument();
      expect(screen.getByText('CZ25596641')).toBeInTheDocument();
      expect(screen.getByTestId('ares-representatives')).toBeInTheDocument();
      expect(screen.getByText('Jan')).toBeInTheDocument();
      expect(screen.getByText('Novák')).toBeInTheDocument();
      expect(screen.getByText('Jednatel')).toBeInTheDocument();
      expect(screen.getByText('1990-01-01')).toBeInTheDocument();
      expect(screen.getByText('CZ')).toBeInTheDocument();
      expect(screen.getByText('onboard.company.ares.inactive_warning')).toBeInTheDocument();

      expect(inputByName('company_name')).toHaveValue('');
      expect(inputByName('street')).toHaveValue('');
      expect(inputByName('tin')).toHaveValue('');
    });

    it('Apply fills only allowed company and registered address fields', async () => {
      getAresCompanyByIco.mockResolvedValueOnce(aresSuccess);
      renderPage();

      const user = await lookupFromAres();
      await screen.findByTestId('ares-preview');
      await user.click(screen.getByRole('button', { name: 'onboard.company.ares.apply' }));

      await waitFor(() => expect(inputByName('company_name')).toHaveValue('ARES Example s.r.o.'));
      expect(inputByName('business_id')).toHaveValue('25596641');
      expect(inputByName('street')).toHaveValue('Václavské náměstí 1');
      expect(inputByName('city')).toHaveValue('Praha');
      expect(inputByName('zip_code')).toHaveValue('11000');
      expect(inputByName('tin')).toHaveValue('CZ25596641');
      expect(screen.getByText('onboard.legal_forms.sro')).toBeInTheDocument();
      expect(screen.getAllByText('countries.cz').length).toBeGreaterThanOrEqual(2);
    });

    it('ARES Apply maps CZ legal_form_code 112 to s.r.o.', async () => {
      getAresCompanyByIco.mockResolvedValueOnce(aresSuccess);
      renderPage();

      const user = await lookupFromAres();
      await screen.findByTestId('ares-preview');
      await user.click(screen.getByRole('button', { name: 'onboard.company.ares.apply' }));

      expect(screen.getByText('onboard.legal_forms.sro')).toBeInTheDocument();
    });

    it('ARES Apply maps CZ legal_form_code 121 to a.s.', async () => {
      getAresCompanyByIco.mockResolvedValueOnce({
        ...aresSuccess,
        legal_form_code: '121',
        legal_form: 'a.s. (Czech Republic)',
      });
      renderPage();

      const user = await lookupFromAres();
      await screen.findByTestId('ares-preview');
      await user.click(screen.getByRole('button', { name: 'onboard.company.ares.apply' }));

      expect(screen.getByText('onboard.legal_forms.as')).toBeInTheDocument();
    });

    it('save payload uses human-readable legal_form for ARES code 121, not raw code', async () => {
      getAresCompanyByIco.mockResolvedValueOnce({
        ...aresSuccess,
        company_name: 'Alza.cz a.s.',
        legal_form_code: '121',
        legal_form: 'a.s. (Czech Republic)',
      });
      renderPage({
        company_phone: '+420777123456',
        certificate_issue_date: '2025-01-01T00:00:00Z',
      });

      const user = await lookupFromAres();
      await screen.findByTestId('ares-preview');
      await user.click(screen.getByRole('button', { name: 'onboard.company.ares.apply' }));
      await user.click(inputByName('first_name'));

      await waitFor(() => {
        expect(putCompanyInfo).toHaveBeenCalledWith(
          expect.objectContaining({ legal_form: 'a.s.' }),
        );
      });
      expect(putCompanyInfo).not.toHaveBeenCalledWith(
        expect.objectContaining({ legal_form: 'as' }),
      );
    });

    it('unknown ARES legal_form_code does not set a wrong legal_form', async () => {
      getAresCompanyByIco.mockResolvedValueOnce({
        ...aresSuccess,
        legal_form_code: '999',
        legal_form: 'Unknown legal form',
      });
      renderPage();

      const user = await lookupFromAres();
      await screen.findByTestId('ares-preview');
      await user.click(screen.getByRole('button', { name: 'onboard.company.ares.apply' }));

      expect(screen.getByText('onboard.company.select_legal')).toBeInTheDocument();
    });

    it('changing country clears incompatible legal_form', async () => {
      renderPage({ country_of_registration: 'de', legal_form: 'gmbh' });
      const user = userEvent.setup();
      const companySection = screen.getByText('onboard.company.title').closest('section');

      expect(within(companySection).getByText('onboard.legal_forms.gmbh')).toBeInTheDocument();
      await user.click(within(companySection).getByRole('button', { name: 'countries.de' }));
      await user.click(within(companySection).getByRole('button', { name: 'countries.cz' }));

      expect(within(companySection).getByText('onboard.company.select_legal')).toBeInTheDocument();
    });

    it('Apply fills country_of_registration as Czech Republic', async () => {
      getAresCompanyByIco.mockResolvedValueOnce(aresSuccess);
      renderPage();

      const user = await lookupFromAres();
      await screen.findByTestId('ares-preview');
      await user.click(screen.getByRole('button', { name: 'onboard.company.ares.apply' }));

      expect(screen.getAllByText('countries.cz').length).toBeGreaterThanOrEqual(2);
    });

    it('Apply fills TIN from DIČ only when TIN is empty', async () => {
      getAresCompanyByIco.mockResolvedValueOnce(aresSuccess);
      renderPage();

      const user = await lookupFromAres();
      await screen.findByTestId('ares-preview');
      await user.click(screen.getByRole('button', { name: 'onboard.company.ares.apply' }));

      await waitFor(() => expect(inputByName('tin')).toHaveValue('CZ25596641'));
    });

    it('shows derived DIČ warning and still fills empty TIN on Apply', async () => {
      getAresCompanyByIco.mockResolvedValueOnce({
        ...aresSuccess,
        dic_hint: 'CZ25596641',
        dic_hint_source: 'derived',
      });
      renderPage();

      const user = await lookupFromAres();

      expect(await screen.findByText('onboard.company.ares.dic_hint_derived')).toBeInTheDocument();
      expect(screen.getByText('onboard.company.ares.dic_hint_derived_warning')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'onboard.company.ares.apply' }));

      await waitFor(() => expect(inputByName('tin')).toHaveValue('CZ25596641'));
    });

    it('Apply does not overwrite existing TIN', async () => {
      getAresCompanyByIco.mockResolvedValueOnce(aresSuccess);
      renderPage({ tin: 'USER-TIN-123' });

      const user = await lookupFromAres();
      await screen.findByTestId('ares-preview');
      await user.click(screen.getByRole('button', { name: 'onboard.company.ares.apply' }));

      expect(inputByName('tin')).toHaveValue('USER-TIN-123');
    });

    it('Apply does not change company phone', async () => {
      getAresCompanyByIco.mockResolvedValueOnce({
        ...aresSuccess,
        company_phone: '+420000000000',
      });
      renderPage({ company_phone: '+420777123456' });

      const user = await lookupFromAres();
      await screen.findByTestId('ares-preview');
      await user.click(screen.getByRole('button', { name: 'onboard.company.ares.apply' }));

      expect(inputByName('company_phone')).toHaveValue('+420777123456');
    });

    it('Apply representative fills empty first_name, last_name, role, birth date and nationality', async () => {
      getAresCompanyByIco.mockResolvedValueOnce(aresSuccess);
      renderPage();

      const user = await lookupFromAres();
      await screen.findByTestId('ares-representatives');
      await user.click(screen.getByRole('button', { name: 'onboard.company.ares.apply_representative' }));

      await waitFor(() => expect(inputByName('first_name')).toHaveValue('Jan'));
      expect(inputByName('last_name')).toHaveValue('Novák');
      expect(screen.getByText('onboard.representative.role_managing')).toBeInTheDocument();
      expect(inputByName('date_of_birth')).toHaveValue('01.01.1990');
      expect(screen.getByText('countries.cz')).toBeInTheDocument();
    });

    it('Apply representative maps RU nationality when option exists', async () => {
      getAresCompanyByIco.mockResolvedValueOnce({
        ...aresSuccess,
        representatives: [
          {
            ...aresSuccess.representatives[0],
            nationality_hint: 'RU',
          },
        ],
      });
      renderPage();

      const user = await lookupFromAres();
      await screen.findByTestId('ares-representatives');
      await user.click(screen.getByRole('button', { name: 'onboard.company.ares.apply_representative' }));

      expect(screen.getByText('countries.ru')).toBeInTheDocument();
    });

    it('initial representative data comes only from CustomUser names', () => {
      localStorage.setItem('first_name', JSON.stringify('Custom'));
      localStorage.setItem('last_name', JSON.stringify('User'));
      renderPage({
        role: 'CEO',
        date_of_birth: '02.02.1980',
        nationality: 'ru',
      });

      expect(inputByName('first_name')).toHaveValue('Custom');
      expect(inputByName('last_name')).toHaveValue('User');
      expect(screen.getByText('onboard.representative.select_role')).toBeInTheDocument();
      expect(inputByName('date_of_birth')).toHaveValue('');
      expect(screen.getByText('onboard.representative.select_nat')).toBeInTheDocument();
    });

    it('Apply representative does not overwrite role or nationality for unknown hints', async () => {
      getAresCompanyByIco.mockResolvedValueOnce({
        ...aresSuccess,
        representatives: [
          {
            first_name: 'Jan',
            last_name: 'Novák',
            role_hint: 'Kontaktní osoba',
            nationality_hint: 'XX',
          },
        ],
      });
      renderPage();

      const user = await lookupFromAres();
      await screen.findByTestId('ares-representatives');
      await user.click(screen.getByRole('button', { name: 'onboard.company.ares.apply_representative' }));

      await waitFor(() => expect(inputByName('first_name')).toHaveValue('Jan'));
      expect(inputByName('last_name')).toHaveValue('Novák');
      expect(screen.getByText('onboard.representative.select_role')).toBeInTheDocument();
      expect(screen.getByText('onboard.representative.select_nat')).toBeInTheDocument();
    });

    it('Apply representative overwrites existing representative fields', async () => {
      getAresCompanyByIco.mockResolvedValueOnce(aresSuccess);
      localStorage.setItem('first_name', JSON.stringify('Alice'));
      localStorage.setItem('last_name', JSON.stringify('Existing'));
      renderPage({
        role: 'CEO',
        date_of_birth: '02.02.1980',
        nationality: 'ru',
      });

      const user = await lookupFromAres();
      await screen.findByTestId('ares-representatives');
      await user.click(screen.getByRole('button', { name: 'onboard.company.ares.apply_representative' }));

      await waitFor(() => expect(inputByName('first_name')).toHaveValue('Jan'));
      expect(inputByName('last_name')).toHaveValue('Novák');
      expect(screen.getByText('onboard.representative.role_managing')).toBeInTheDocument();
      expect(inputByName('date_of_birth')).toHaveValue('01.01.1990');
      expect(screen.getByText('countries.cz')).toBeInTheDocument();
    });

    it('Apply representative replaces CustomUser first_name and last_name', async () => {
      getAresCompanyByIco.mockResolvedValueOnce(aresSuccess);
      localStorage.setItem('first_name', JSON.stringify('Custom'));
      localStorage.setItem('last_name', JSON.stringify('User'));
      renderPage();

      const user = await lookupFromAres();
      await screen.findByTestId('ares-representatives');
      await user.click(screen.getByRole('button', { name: 'onboard.company.ares.apply_representative' }));

      expect(inputByName('first_name')).toHaveValue('Jan');
      expect(inputByName('last_name')).toHaveValue('Novák');
    });

    it('keeps submitted values when an API request fails', async () => {
      getAresCompanyByIco.mockResolvedValueOnce(aresSuccess);
      putOnboardingBank.mockRejectedValueOnce(new Error('Account holder mismatch'));
      localStorage.setItem('first_name', JSON.stringify('Custom'));
      localStorage.setItem('last_name', JSON.stringify('User'));
      renderPage({
        company_name: 'ARES Example s.r.o.',
        legal_form: 'sro',
        country_of_registration: 'cz',
        business_id: '25596641',
        tin: 'CZ25596641',
        company_phone: '+420777123456',
        certificate_issue_date: '2025-01-01T00:00:00Z',
        street: 'Václavské náměstí 1',
        city: 'Praha',
        zip_code: '11000',
        country: 'cz',
        proof_document_issue_date: '2025-01-01T00:00:00Z',
        iban: 'CZ6508000000192000145399',
        swift_bic: 'GIBACZPX',
        account_holder: 'ARES Example s.r.o.',
        bank_code: '0800',
        local_account_number: '192000145399',
        same_as_the_primary_address: true,
        wStreet: 'Václavské náměstí 1',
        wCity: 'Praha',
        wZip_code: '11000',
        wCountry: 'cz',
        contact_phone: '+420777123456',
        wProof_document_issue_date: '',
        same_as_warehouse: true,
        rStreet: 'Václavské náměstí 1',
        rCity: 'Praha',
        rZip_code: '11000',
        rCountry: 'cz',
        rContact_phone: '+420777123456',
        rProof_document_issue_date: '',
      });

      const user = await lookupFromAres();
      await screen.findByTestId('ares-representatives');
      await user.click(screen.getByRole('button', { name: 'onboard.company.ares.apply_representative' }));
      await waitFor(() => expect(inputByName('first_name')).toHaveValue('Jan'));

      await user.click(screen.getByRole('button', { name: 'onboard.common.continue_review' }));
      await waitFor(() => expect(putOnboardingBank).toHaveBeenCalled());

      expect(inputByName('first_name')).toHaveValue('Jan');
      expect(inputByName('last_name')).toHaveValue('Novák');
      expect(screen.getByText('onboard.representative.role_managing')).toBeInTheDocument();
      expect(inputByName('date_of_birth')).toHaveValue('01.01.1990');
      expect(screen.getAllByText('countries.cz').length).toBeGreaterThanOrEqual(2);
      expect(document.querySelector('#same_as_warehouse')).toBeChecked();
    });

    it('shows invalid IČO error', async () => {
      getAresCompanyByIco.mockRejectedValueOnce({
        status: 400,
        code: 'ares_invalid_ico',
        message: 'Invalid Czech IČO.',
      });
      renderPage();

      await lookupFromAres('abc');

      expect(await screen.findByRole('alert')).toHaveTextContent('onboard.company.ares.errors.invalid');
    });

    it('renders invalid IČO error in Czech', async () => {
      i18nMocks.language = 'cz';
      getAresCompanyByIco.mockRejectedValueOnce({
        status: 400,
        code: 'ares_invalid_ico',
        message: 'Invalid Czech IČO.',
      });
      renderPage();

      const user = userEvent.setup();
      await user.type(inputByName('business_id'), 'abc');
      await user.click(screen.getByRole('button', { name: 'Načíst z ARES' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Před načtením z ARES zadejte platné české IČO.'
      );
    });

    it('shows not found and unavailable errors', async () => {
      const user = userEvent.setup();
      getAresCompanyByIco
        .mockRejectedValueOnce({ status: 404, code: 'ares_not_found' })
        .mockRejectedValueOnce({ status: 503, code: 'ares_unavailable' });
      renderPage();

      await user.type(inputByName('business_id'), '25596641');
      await user.click(screen.getByRole('button', { name: 'onboard.company.ares.load' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('onboard.company.ares.errors.not_found');

      await user.click(screen.getByRole('button', { name: 'onboard.company.ares.load' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('onboard.company.ares.errors.unavailable');
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
      expect(screen.getByText('onboard.company.name').className).toMatch(/titleRequired/);
    });

    it('shows required marker (*) on iban label', () => {
      renderPage();
      expect(screen.getByText('onboard.bank.iban').className).toMatch(/titleRequired/);
    });

    it('shows required marker on company_phone label', () => {
      renderPage();
      expect(screen.getByText('onboard.company.phone').className).toMatch(/titleRequired/);
    });

    it('marks required uploads as required by default', () => {
      renderPage();
      const companyHeading = screen.getByText('onboard.company.title');
      const section = companyHeading.closest('section');
      expect(within(section).getByText('onboard.company.cert_title')).toHaveAttribute('data-required', 'true');
    });

    it('hides warehouse proof upload when warehouse matches primary address', () => {
      renderPage({ same_as_the_primary_address: true });
      const warehouseHeading = screen.getByText('onboard.warehouse.title');
      const section = warehouseHeading.closest('section');
      expect(within(section).queryByText('onboard.tax_address.proof_address')).not.toBeInTheDocument();
    });
  });

  // ── 10. Submit button ──────────────────────────────────────────────────────

  describe('Submit button', () => {
    it('renders the Continue to Review button', () => {
      renderPage();
      expect(screen.getByRole('button', { name: 'onboard.common.continue_review' })).toBeInTheDocument();
    });

    it('submit button is disabled when required fields are missing on initial render', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'onboard.common.continue_review' })).toBeDisabled();
      });
    });
  });
});
