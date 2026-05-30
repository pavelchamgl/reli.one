/**
 * FE-023 Iteration 4 — Company review field contract.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
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
    safeCompanyData: vi.fn(),
    getAllCompanyDataBD: vi.fn().mockResolvedValue({}),
  }),
}));

vi.mock('../../api/seller/onboarding', () => ({
  getReviewOnboarding: vi.fn().mockResolvedValue({}),
  getOnboardingStatus: vi.fn().mockResolvedValue({ can_submit: true }),
  postSubmitOnboarding: vi.fn().mockResolvedValue({ status: 'pending_verification' }),
  putCompanyInfo: vi.fn().mockResolvedValue({}),
  putRepresentative: vi.fn().mockResolvedValue({}),
  putCompanyAddress: vi.fn().mockResolvedValue({}),
  putOnboardingBank: vi.fn().mockResolvedValue({}),
  putWarehouse: vi.fn().mockResolvedValue({}),
  putReturnAddress: vi.fn().mockResolvedValue({}),
  uploadSingleDocument: vi.fn().mockResolvedValue({ uploaded_at: '2025-01-01' }),
}));

vi.mock('../../api/seller/getOnboardingData', () => ({
  getAccountData: vi.fn().mockResolvedValue({}),
  getCompanyInfo: vi.fn().mockResolvedValue({}),
  getRepresentativeData: vi.fn().mockResolvedValue({}),
  getCompanyAddress: vi.fn().mockResolvedValue({}),
  getBankData: vi.fn().mockResolvedValue({}),
  getWarehouseData: vi.fn().mockResolvedValue({}),
  getReturnData: vi.fn().mockResolvedValue({}),
  getDocumentsData: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../ui/Toastify', () => ({ ErrToast: vi.fn() }));

import { renderWithProviders } from '../../test/test-utils.jsx';
import { setupStore } from '../../redux/index.js';
import SellerReviewCompany from './SellerReviewCompany.jsx';

const ROUTE = '/seller/seller-review-company';

const companyData = {
  company_name: 'Acme GmbH',
  legal_form: 'GmbH',
  country_of_registration: 'de',
  business_id: 'HRB1',
  tin: 'DE123',
  company_phone: '+49151',
  company_file_date: 'cert.pdf',
  role: 'Director',
  date_of_birth: '01.01.1990',
  nationality: 'de',
  street: 'Street 1',
  city: 'Berlin',
  zip_code: '10115',
  country: 'de',
  company_address_name: 'addr.pdf',
  iban: 'DE89370400440532013000',
  swift_bic: 'COBADEFFXXX',
  account_holder: 'Acme GmbH',
  wStreet: 'W St',
  wCity: 'Munich',
  wZip_code: '80331',
  wCountry: 'de',
  contact_phone: '+49222',
  warehouse_name: 'w.pdf',
  same_as_warehouse: true,
  front: 'front-id.pdf',
  back: 'back-id.pdf',
  ico: '999',
};

function renderPage() {
  const store = setupStore({
    selfEmploed: {
      companyData,
      companyDataLoading: false,
      selfData: {},
      registerData: { phone: '+49999' },
    },
  });
  return renderWithProviders(<SellerReviewCompany />, {
    route: ROUTE,
    storeInstance: store,
  });
}

describe('SellerReviewCompany — review parity', () => {
  beforeEach(() => {
    localStorage.setItem('first_name', JSON.stringify('Jane'));
    localStorage.setItem('last_name', JSON.stringify('Smith'));
  });

  it('renders all review section titles', () => {
    renderPage();
    expect(screen.getByText('onboard.review.representative')).toBeInTheDocument();
    expect(screen.getByText('onboard.company.title')).toBeInTheDocument();
    expect(screen.getByText('onboard.tax_address.title_business')).toBeInTheDocument();
    expect(screen.getByText('onboard.bank.title')).toBeInTheDocument();
    expect(screen.getByText('onboard.review.warehouse_return')).toBeInTheDocument();
  });

  it('shows contract field labels in review sections', () => {
    renderPage();
    expect(screen.getByText('onboard.reg.first_name')).toBeInTheDocument();
    expect(screen.getByText('onboard.seller_info.nationality')).toBeInTheDocument();
    expect(screen.getByText('onboard.company.business_id')).toBeInTheDocument();
    expect(screen.getByText('onboard.bank.iban')).toBeInTheDocument();
  });

  it('does not show forbidden identity upload or VAT/ICO rows', () => {
    renderPage();
    expect(screen.queryByText('onboard.review.identity_doc')).not.toBeInTheDocument();
    expect(screen.queryByText('IČO')).not.toBeInTheDocument();
    expect(screen.queryByText('VAT ID')).not.toBeInTheDocument();
  });

  it('opens inline edit for company section without losing form fields', async () => {
    const user = userEvent.setup();
    renderPage();

    const companySection = screen.getByText('onboard.company.title').closest('section');
    const editButtons = within(companySection).getAllByRole('button', {
      name: 'onboard.review.edit',
    });
    await user.click(editButtons[0]);

    expect(screen.getByDisplayValue('Acme GmbH')).toBeInTheDocument();
  });

  it('shows submit error alert when validation fails', async () => {
    const user = userEvent.setup();
    const store = setupStore({
      selfEmploed: {
        companyData: { ...companyData, tin: '' },
        companyDataLoading: false,
        selfData: {},
        registerData: {},
      },
    });
    renderWithProviders(<SellerReviewCompany />, {
      route: ROUTE,
      storeInstance: store,
    });

    await user.click(screen.getByRole('button', { name: 'onboard.review.submit_btn' }));
    expect(screen.getByText('onboard.errors.complete_fields')).toBeInTheDocument();
  });
});
