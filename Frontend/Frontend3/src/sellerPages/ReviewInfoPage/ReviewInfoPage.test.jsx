import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockNavigate = vi.fn();

const i18nMocks = vi.hoisted(() => ({
  language: 'keys',
  translations: {
    en: {
      'onboard.errors.submit_data_failed': 'Failed to submit onboarding data',
      'onboard.errors.unknown': 'Unknown error',
      'onboard.errors.unexpected': 'Unexpected error',
    },
    cz: {
      'onboard.errors.submit_failed': 'Nepodařilo se odeslat registraci',
      'onboard.errors.submit_data_failed': 'Nepodařilo se odeslat údaje registrace',
      'onboard.errors.unknown': 'Neznámá chyba',
      'onboard.errors.unexpected': 'Neočekávaná chyba',
      'onboard.review.submit_btn': 'Odeslat k ověření',
    },
  },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key, options) => {
        const language = options?.lng ?? i18nMocks.language;
        return i18nMocks.translations[language]?.[key] ?? key;
      },
      i18n: {
        changeLanguage: vi.fn((language) => {
          i18nMocks.language = language;
        }),
      },
    }),
  };
});

vi.mock('../../hook/useActionSafeEmploed', () => ({
  useActionSafeEmploed: () => ({
    getAllDataFromBD: vi.fn(),
  }),
}));

vi.mock('../../api/seller/onboarding', () => ({
  getReviewOnboarding: vi.fn().mockResolvedValue({}),
  getOnboardingStatus: vi.fn(),
  postSubmitOnboarding: vi.fn(),
  putPersonalData: vi.fn(),
  putTax: vi.fn(),
  putSelfAddress: vi.fn(),
  putOnboardingBank: vi.fn(),
  putWarehouse: vi.fn(),
  putReturnAddress: vi.fn(),
}));

vi.mock('../../ui/Toastify', () => ({
  ErrToast: vi.fn(),
}));

import { renderWithProviders } from '../../test/test-utils.jsx';
import { setupStore } from '../../redux/index.js';
import ReviewInfoPage from './ReviewInfoPage.jsx';
import {
  getOnboardingStatus,
  postSubmitOnboarding,
  putOnboardingBank,
  putPersonalData,
  putReturnAddress,
  putSelfAddress,
  putTax,
  putWarehouse,
} from '../../api/seller/onboarding';

const baseSelfData = {
  nationality: 'cz',
  tax_country: 'cz',
  country: 'cz',
  wCountry: 'cz',
  rCountry: 'cz',
  same_as_the_primary_address: false,
  same_as_warehouse: true,
};

function renderReviewPage(selfData = baseSelfData) {
  localStorage.setItem('first_name', JSON.stringify('Jan'));
  localStorage.setItem('last_name', JSON.stringify('Novak'));
  localStorage.setItem('phone', JSON.stringify('+420123456789'));
  localStorage.setItem('email', JSON.stringify('jan@example.com'));

  return renderWithProviders(<ReviewInfoPage />, {
    route: '/seller/seller-review',
    storeInstance: setupStore({
      selfEmploed: {
        selfData,
        selfDataLoading: false,
        companyData: {},
        companyDataLoading: false,
        registerData: {},
      },
    }),
  });
}

describe('ReviewInfoPage submit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    i18nMocks.language = 'keys';
    putPersonalData.mockResolvedValue({});
    putTax.mockResolvedValue({});
    putSelfAddress.mockResolvedValue({});
    putOnboardingBank.mockResolvedValue({});
    putWarehouse.mockResolvedValue({});
    putReturnAddress.mockResolvedValue({});
  });

  it('keeps submit button enabled before submit', () => {
    renderReviewPage();

    expect(
      screen.getByRole('button', { name: 'onboard.review.submit_btn' })
    ).toBeEnabled();
  });

  it('shows completeness error in alert when a PUT fails with completeness flags', async () => {
    const user = userEvent.setup();
    putOnboardingBank.mockRejectedValue({
      response: {
        data: {
          completeness: {
            bank_complete: 'false',
            personal_complete: 'true',
          },
        },
      },
    });

    renderReviewPage();

    await user.click(screen.getByRole('button', { name: 'onboard.review.submit_btn' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Bank Account: Please complete: Bank account'
      );
    });

    expect(getOnboardingStatus).not.toHaveBeenCalled();
    expect(postSubmitOnboarding).not.toHaveBeenCalled();
  });

  it('shows section validation details from API wrapper data instead of Unknown error', async () => {
    const user = userEvent.setup();
    putOnboardingBank.mockRejectedValue({
      status: 400,
      message: 'Failed to save bank information',
      data: {
        account_holder: 'For self-employed, account holder must match seller full name.',
      },
    });

    renderReviewPage();

    await user.click(screen.getByRole('button', { name: 'onboard.review.submit_btn' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Bank Account: For self-employed, account holder must match seller full name.'
      );
    });
    expect(screen.queryByText('Unknown error')).not.toBeInTheDocument();
  });

  it('shows incomplete onboarding message when can_submit is false', async () => {
    const user = userEvent.setup();
    getOnboardingStatus.mockResolvedValue({ can_submit: false });

    renderReviewPage();

    await user.click(screen.getByRole('button', { name: 'onboard.review.submit_btn' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('onboard.review.err_incomplete');
    });

    expect(postSubmitOnboarding).not.toHaveBeenCalled();
  });

  it('shows submit endpoint validation details instead of generic submit failure', async () => {
    const user = userEvent.setup();
    getOnboardingStatus.mockResolvedValue({ can_submit: true });
    postSubmitOnboarding.mockRejectedValueOnce({
      status: 400,
      message: 'Failed to submit onboarding data',
      data: {
        completeness: {
          documents_complete: false,
          bank_complete: true,
        },
      },
    });

    renderReviewPage();

    await user.click(screen.getByRole('button', { name: 'onboard.review.submit_btn' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Please complete: Documents');
    });
    expect(screen.queryByText('Failed to submit onboarding data')).not.toBeInTheDocument();
  });

  it('shows Czech submit fallback when submit endpoint returns a generic English error', async () => {
    i18nMocks.language = 'cz';
    const user = userEvent.setup();
    getOnboardingStatus.mockResolvedValue({ can_submit: true });
    postSubmitOnboarding.mockRejectedValueOnce({
      status: 500,
      message: 'Failed to submit onboarding data',
    });

    renderReviewPage();

    await user.click(screen.getByRole('button', { name: 'Odeslat k ověření' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Nepodařilo se odeslat registraci');
    });
    expect(screen.queryByText('Failed to submit onboarding data')).not.toBeInTheDocument();
  });

  it('omits return proof date when return address is linked to warehouse', async () => {
    const user = userEvent.setup();
    getOnboardingStatus.mockResolvedValue({ can_submit: false });

    renderReviewPage({ ...baseSelfData, same_as_warehouse: true, rProof_document_issue_date: '' });

    await user.click(screen.getByRole('button', { name: 'onboard.review.submit_btn' }));

    await waitFor(() => {
      expect(putReturnAddress).toHaveBeenCalledWith(
        expect.objectContaining({ same_as_warehouse: true })
      );
    });

    expect(putReturnAddress.mock.calls[0][0]).not.toHaveProperty(
      'proof_document_issue_date'
    );
  });

  it('keeps same_as_the_primary_address checked when opening Warehouse Address edit from review', async () => {
    const user = userEvent.setup();

    renderReviewPage({
      ...baseSelfData,
      same_as_primary_address: true,
      same_as_the_primary_address: undefined,
      wStreet: 'Dlouhá 12',
      wCity: 'Praha',
      wZip_code: '11000',
      wCountry: 'cz',
      contact_phone: '+420777777777',
    });

    const warehouseSection = screen.getByText('onboard.review.warehouse_return').closest('section');
    await user.click(within(warehouseSection).getByRole('button', {
      name: 'onboard.review.edit',
    }));

    expect(document.querySelector('#same_as_the_primary_address')).toBeChecked();
  });

  it('includes same_as_primary_address in persisted self-employed warehouse payload', async () => {
    const user = userEvent.setup();
    getOnboardingStatus.mockResolvedValue({ can_submit: false });

    renderReviewPage({
      ...baseSelfData,
      same_as_primary_address: true,
      same_as_the_primary_address: undefined,
      wStreet: 'Dlouhá 12',
      wCity: 'Praha',
      wZip_code: '11000',
      wCountry: 'cz',
      contact_phone: '+420777777777',
    });

    await user.click(screen.getByRole('button', { name: 'onboard.review.submit_btn' }));

    await waitFor(() => {
      expect(putWarehouse).toHaveBeenCalledWith(
        expect.objectContaining({ same_as_primary_address: true })
      );
    });
  });
});
