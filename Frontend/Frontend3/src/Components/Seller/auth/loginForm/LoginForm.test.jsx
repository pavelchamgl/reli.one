import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
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

vi.mock('../../../../api/auth', () => ({
  login: vi.fn(),
}));

vi.mock('../../../../api/seller/onboarding', () => ({
  getOnboardingStatus: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { renderWithProviders } from '../../../../test/test-utils.jsx';
import LoginForm from './LoginForm.jsx';
import { login } from '../../../../api/auth';
import { getOnboardingStatus } from '../../../../api/seller/onboarding';

const VALID_PASSWORD = 'Test1234!';

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    getOnboardingStatus.mockResolvedValue({
      requires_onboarding: true,
      is_editable: true,
      next_step: 'seller_type',
    });
  });

  it('shows Yup validation errors after empty fields are touched', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole('textbox', { name: 'email' }));
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('validation.email.required')).toBeInTheDocument();
    });

    const passwordInput = document.querySelector('input[name="password"]');
    await user.click(passwordInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('validation.password.required')).toBeInTheDocument();
    });
  });

  it('disables submit until form is valid and dirty', async () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByRole('button', { name: 'auth.login' })).toBeDisabled();
  });

  it('calls login API on valid submit', async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({ data: { access: 'token', refresh: 'refresh' } });

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByRole('textbox', { name: 'email' }), 'seller@example.com');
    await user.type(document.querySelector('input[name="password"]'), VALID_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'auth.login' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'seller@example.com',
        password: VALID_PASSWORD,
      });
    });
  });
});
