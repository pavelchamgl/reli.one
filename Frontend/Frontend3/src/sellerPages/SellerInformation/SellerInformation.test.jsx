import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
    safeData: vi.fn(),
    safeCompanyData: vi.fn(),
    getAllDataFromBD: vi.fn().mockResolvedValue({}),
    getAllCompanyDataBD: vi.fn().mockResolvedValue({}),
    setRegisterData: vi.fn(),
  }),
}));

vi.mock('../../api/seller/onboarding', () => ({
  getAresCompanyByIco: vi.fn(),
  putPersonalData: vi.fn().mockResolvedValue({}),
  putTax: vi.fn().mockResolvedValue({}),
  putSelfAddress: vi.fn().mockResolvedValue({}),
  putOnboardingBank: vi.fn().mockResolvedValue({}),
  putWarehouse: vi.fn().mockResolvedValue({}),
  putReturnAddress: vi.fn().mockResolvedValue({}),
  uploadSingleDocument: vi.fn().mockResolvedValue({ uploaded_at: '2025-01-01' }),
}));

vi.mock('../../api/seller/getOnboardingData', () => ({
  getAccountData: vi.fn().mockResolvedValue({ first_name: '', last_name: '' }),
  getPersonalData: vi.fn().mockResolvedValue({}),
  getTaxData: vi.fn().mockResolvedValue({}),
  getSelfAddressData: vi.fn().mockResolvedValue({}),
  getBankData: vi.fn().mockResolvedValue({}),
  getWarehouseData: vi.fn().mockResolvedValue({}),
  getReturnData: vi.fn().mockResolvedValue({}),
  getDocumentsData: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../ui/Toastify', () => ({ ErrToast: vi.fn() }));

import { renderWithProviders } from '../../test/test-utils.jsx';
import { setupStore } from '../../redux/index.js';
import SellerInformation, { SELF_EMPLOYED_ARES_ENTRY_ASSIST_STORAGE_KEY } from './SellerInformation.jsx';
import { getAresCompanyByIco, uploadSingleDocument } from '../../api/seller/onboarding';

const ROUTE = '/seller/seller-info';

function makeStore(selfDataOverride = {}) {
  return setupStore({
    selfEmploed: {
      selfData: { ...selfDataOverride },
      selfDataLoading: false,
      companyData: {},
      companyDataLoading: false,
      registerData: {},
    },
  });
}

function renderPage(selfDataOverride = {}, options = {}) {
  if (options.dismissAssist !== false) {
    localStorage.setItem(SELF_EMPLOYED_ARES_ENTRY_ASSIST_STORAGE_KEY, 'test-dismissed');
  } else {
    localStorage.removeItem(SELF_EMPLOYED_ARES_ENTRY_ASSIST_STORAGE_KEY);
  }

  return renderWithProviders(<SellerInformation />, {
    route: ROUTE,
    storeInstance: makeStore(selfDataOverride),
  });
}

function inputByName(name) {
  return document.querySelector(`[name="${name}"]`);
}

describe('SellerInformation — self-employed ARES assist', () => {
  const aresSuccess = {
    found: true,
    ico: '25596641',
    business_id: '25596641',
    company_name: 'Jan Novak',
    registry_name: 'Jan Novak',
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

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('entry assist modal', () => {
    async function openEntryAssist(selfData = {}) {
      renderPage(selfData, { dismissAssist: false });
      return screen.findByTestId('self-employed-ares-entry-modal');
    }

    async function lookupInEntryAssist(ico = '25596641') {
      const user = userEvent.setup();
      const modal = await openEntryAssist();
      await user.type(within(modal).getByRole('textbox', { name: 'onboard.company.business_id' }), ico);
      await user.click(within(modal).getByRole('button', { name: 'onboard.self_employed_ares.entry.load' }));
      return { user, modal };
    }

    it('appears on empty self-employed onboarding with manual fallback copy', async () => {
      const modal = await openEntryAssist();

      expect(modal).toBeInTheDocument();
      expect(within(modal).getByText('onboard.self_employed_ares.entry.description')).toBeInTheDocument();
      expect(within(modal).getByText('onboard.self_employed_ares.entry.scope_note')).toBeInTheDocument();
      expect(within(modal).getByRole('button', { name: 'onboard.self_employed_ares.entry.manual' })).toBeInTheDocument();
    });

    it('does not appear when self-employed legal or tax data already exists', async () => {
      renderPage({ tin: 'EXISTING-TIN' }, { dismissAssist: false });

      await waitFor(() => {
        expect(screen.queryByTestId('self-employed-ares-entry-modal')).not.toBeInTheDocument();
      });
    });

    it('Fill manually closes modal without mutating the form', async () => {
      const user = userEvent.setup();
      const modal = await openEntryAssist();

      await user.click(within(modal).getByRole('button', { name: 'onboard.self_employed_ares.entry.manual' }));

      await waitFor(() => {
        expect(screen.queryByTestId('self-employed-ares-entry-modal')).not.toBeInTheDocument();
      });
      expect(localStorage.getItem(SELF_EMPLOYED_ARES_ENTRY_ASSIST_STORAGE_KEY)).toBe('manual');
      expect(inputByName('ico')).toHaveValue('');
      expect(inputByName('tin')).toHaveValue('');
      expect(inputByName('street')).toHaveValue('');
    });

    it('success lookup renders preview before applying', async () => {
      getAresCompanyByIco.mockResolvedValueOnce(aresSuccess);

      const { modal } = await lookupInEntryAssist();

      expect(await within(modal).findByTestId('self-employed-ares-entry-preview')).toBeInTheDocument();
      expect(within(modal).getByText('Jan Novak')).toBeInTheDocument();
      expect(within(modal).getByText('25596641')).toBeInTheDocument();
      expect(within(modal).getByText('Dlouhá 12, Praha, 11000, CZ')).toBeInTheDocument();
      expect(within(modal).getByText('CZ25596641')).toBeInTheDocument();
      expect(inputByName('ico')).toHaveValue('');
      expect(inputByName('tin')).toHaveValue('');
    });

    it('Apply fills approved tax and address fields, then closes modal', async () => {
      getAresCompanyByIco.mockResolvedValueOnce(aresSuccess);

      const { user, modal } = await lookupInEntryAssist();
      await within(modal).findByTestId('self-employed-ares-entry-preview');
      await user.click(within(modal).getByRole('button', { name: 'onboard.self_employed_ares.entry.apply' }));

      await waitFor(() => expect(screen.queryByTestId('self-employed-ares-entry-modal')).not.toBeInTheDocument());
      expect(localStorage.getItem(SELF_EMPLOYED_ARES_ENTRY_ASSIST_STORAGE_KEY)).toBe('apply');
      expect(inputByName('ico')).toHaveValue('25596641');
      expect(inputByName('tin')).toHaveValue('CZ25596641');
      expect(inputByName('street')).toHaveValue('Dlouhá 12');
      expect(inputByName('city')).toHaveValue('Praha');
      expect(inputByName('zip_code')).toHaveValue('11000');
      expect(inputByName('personal_phone')).toHaveValue('');
      expect(inputByName('iban')).toHaveValue('');
      expect(inputByName('wStreet')).toHaveValue('');
      expect(inputByName('rStreet')).toHaveValue('');
    });

    it('error states keep manual mode available and Apply unavailable', async () => {
      const user = userEvent.setup();
      const modal = await openEntryAssist();
      await user.type(within(modal).getByRole('textbox', { name: 'onboard.company.business_id' }), '25596641');

      for (const errorCase of [
        { status: 404, code: 'ares_not_found', key: 'not_found' },
        { status: 400, code: 'ares_invalid_ico', key: 'invalid' },
        { status: 503, code: 'ares_unavailable', key: 'unavailable' },
      ]) {
        getAresCompanyByIco.mockRejectedValueOnce(errorCase);
        await user.click(within(modal).getByRole('button', { name: 'onboard.self_employed_ares.entry.load' }));

        expect(await within(modal).findByRole('alert')).toHaveTextContent(`onboard.self_employed_ares.errors.${errorCase.key}`);
        expect(within(modal).queryByRole('button', { name: 'onboard.self_employed_ares.entry.apply' })).not.toBeInTheDocument();
        expect(within(modal).getByRole('button', { name: 'onboard.self_employed_ares.entry.manual' })).toBeInTheDocument();
      }
    });
  });

  describe('inline lookup', () => {
    async function lookupInline(ico = '25596641', selfData = {}) {
      const user = userEvent.setup();
      renderPage(selfData);
      await user.type(inputByName('ico'), ico);
      await user.click(screen.getByRole('button', { name: 'onboard.self_employed_ares.load' }));
      return user;
    }

    it('lookup calls ARES and renders preview without mutating before Apply', async () => {
      getAresCompanyByIco.mockResolvedValueOnce(aresSuccess);

      await lookupInline();

      expect(getAresCompanyByIco).toHaveBeenCalledWith('25596641');
      expect(await screen.findByTestId('self-employed-ares-preview')).toBeInTheDocument();
      expect(screen.getByText('Jan Novak')).toBeInTheDocument();
      expect(screen.getByText('Dlouhá 12, Praha, 11000, CZ')).toBeInTheDocument();
      expect(inputByName('tin')).toHaveValue('');
      expect(inputByName('street')).toHaveValue('');
    });

    it('Apply fills approved fields from inline preview', async () => {
      getAresCompanyByIco.mockResolvedValueOnce(aresSuccess);

      const user = await lookupInline();
      await screen.findByTestId('self-employed-ares-preview');
      await user.click(screen.getByRole('button', { name: 'onboard.self_employed_ares.apply' }));

      expect(inputByName('ico')).toHaveValue('25596641');
      expect(inputByName('tin')).toHaveValue('CZ25596641');
      expect(inputByName('street')).toHaveValue('Dlouhá 12');
      expect(inputByName('city')).toHaveValue('Praha');
      expect(inputByName('zip_code')).toHaveValue('11000');
    });

    it('Apply does not overwrite non-empty user fields or forbidden sections', async () => {
      getAresCompanyByIco.mockResolvedValueOnce({
        ...aresSuccess,
        personal_phone: '+420000000000',
        iban: 'CZ6508000000192000145399',
        wStreet: 'Warehouse from ARES',
        rStreet: 'Return from ARES',
      });
      localStorage.setItem('phone', JSON.stringify('+420777777777'));

      const user = await lookupInline('25596641', {
        tin: 'USER-TIN-123',
        street: 'User Street 7',
        city: 'User City',
        zip_code: '99999',
        iban: 'CZ6508000000192000145399',
        wStreet: 'User Warehouse',
        rStreet: 'User Return',
      });
      await screen.findByTestId('self-employed-ares-preview');
      await user.click(screen.getByRole('button', { name: 'onboard.self_employed_ares.apply' }));

      expect(inputByName('tin')).toHaveValue('USER-TIN-123');
      expect(inputByName('street')).toHaveValue('User Street 7');
      expect(inputByName('city')).toHaveValue('User City');
      expect(inputByName('zip_code')).toHaveValue('99999');
      expect(inputByName('personal_phone')).toHaveValue('+420777777777');
      expect(inputByName('iban')).toHaveValue('CZ6508000000192000145399');
      expect(inputByName('wStreet')).toHaveValue('User Warehouse');
      expect(inputByName('rStreet')).toHaveValue('User Return');
    });

    it('keeps ARES-prefilled tax and address fields after identity document upload', async () => {
      getAresCompanyByIco.mockResolvedValueOnce(aresSuccess);
      renderPage();
      const user = userEvent.setup();

      await user.type(inputByName('ico'), '25596641');
      await user.click(screen.getByRole('button', { name: 'onboard.self_employed_ares.load' }));
      await screen.findByTestId('self-employed-ares-preview');
      await user.click(screen.getByRole('button', { name: 'onboard.self_employed_ares.apply' }));

      expect(inputByName('tin')).toHaveValue('CZ25596641');
      expect(inputByName('street')).toHaveValue('Dlouhá 12');
      expect(inputByName('city')).toHaveValue('Praha');
      expect(inputByName('zip_code')).toHaveValue('11000');

      const uploadControl = document.querySelector('input[type="file"]');
      const file = new File(['passport-content'], 'passport.jpg', { type: 'image/jpeg' });
      await user.upload(uploadControl, file);

      await waitFor(() => {
        expect(uploadSingleDocument).toHaveBeenCalled();
      });
      expect(inputByName('tin')).toHaveValue('CZ25596641');
      expect(inputByName('street')).toHaveValue('Dlouhá 12');
      expect(inputByName('city')).toHaveValue('Praha');
      expect(inputByName('zip_code')).toHaveValue('11000');
    });

    it('not found keeps manual fields available', async () => {
      getAresCompanyByIco.mockRejectedValueOnce({ status: 404, code: 'ares_not_found' });

      await lookupInline();

      expect(await screen.findByRole('alert')).toHaveTextContent('onboard.self_employed_ares.errors.not_found');
      expect(screen.queryByRole('button', { name: 'onboard.self_employed_ares.apply' })).not.toBeInTheDocument();
      expect(inputByName('ico')).toBeInTheDocument();
      expect(inputByName('tin')).toBeInTheDocument();
    });
  });
});
