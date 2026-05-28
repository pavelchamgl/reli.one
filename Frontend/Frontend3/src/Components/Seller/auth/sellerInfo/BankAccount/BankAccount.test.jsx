import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormik } from 'formik';

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

vi.mock('../../../../../api/seller/onboarding', () => ({
  putOnboardingBank: vi.fn(),
}));

vi.mock('../../../../../api/seller/getOnboardingData', () => ({
  getAccountData: vi.fn().mockResolvedValue({
    first_name: 'Jane',
    last_name: 'Smith',
  }),
}));

vi.mock('../../../../../ui/Toastify', () => ({
  ErrToast: vi.fn(),
}));

import { renderWithProviders } from '../../../../../test/test-utils.jsx';
import BankAccount from './BankAccount.jsx';
import { putOnboardingBank } from '../../../../../api/seller/onboarding';

function BankAccountHarness({ initialValues = {} }) {
  const formik = useFormik({
    initialValues: {
      first_name: 'Jane',
      last_name: 'Smith',
      tax_country: 'de',
      country: 'de',
      iban: '',
      swift_bic: '',
      account_holder: '',
      bank_code: '',
      local_account_number: '',
      ...initialValues,
    },
    onSubmit: vi.fn(),
  });

  return (
    <>
      <BankAccount formik={formik} />
      <button type="button">outside</button>
    </>
  );
}

describe('BankAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows API validation error on account_holder after blur save fails', async () => {
    const user = userEvent.setup();
    putOnboardingBank.mockRejectedValue(new Error('Invalid IBAN format'));

    renderWithProviders(<BankAccountHarness />, { route: '/seller/seller-info' });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument();
    });

    await user.type(screen.getByRole('textbox', { name: /onboard\.bank\.iban/i }), 'DE89370400440532013000');
    await user.type(screen.getByRole('textbox', { name: /onboard\.bank\.swift/i }), 'COBADEFFXXX');
    await user.click(screen.getByRole('button', { name: 'outside' }));

    await waitFor(() => {
      expect(putOnboardingBank).toHaveBeenCalled();
      expect(screen.getByText('Invalid IBAN format')).toBeInTheDocument();
    });
  });
});
