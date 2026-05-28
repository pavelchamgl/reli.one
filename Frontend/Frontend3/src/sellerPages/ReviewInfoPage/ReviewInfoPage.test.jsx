import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockNavigate = vi.fn();

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
      t: (key) => key,
      i18n: { changeLanguage: vi.fn() },
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
});
