import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
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

vi.mock('../../../../../api/seller/auth', () => ({
  registerSeller: vi.fn(),
}));

vi.mock('../../../../../hook/useActionSafeEmploed', () => ({
  useActionSafeEmploed: () => ({
    setRegisterData: vi.fn(),
  }),
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { renderWithProviders } from '../../../../../test/test-utils.jsx';
import CreateForm from './CreateForm.jsx';
import { registerSeller } from '../../../../../api/seller/auth';

const VALID_PASSWORD = 'Test1234!';

describe('CreateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('blocks submit until agree checkbox is checked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateForm />);

    await user.type(screen.getByLabelText(/reg.label_first_name/), 'John');
    await user.type(screen.getByLabelText(/reg.label_last_name/), 'Doe');
    await user.type(screen.getByLabelText(/reg.label_email/), 'seller@example.com');
    await user.click(screen.getByLabelText(/reg.label_phone/));
    await user.type(screen.getByLabelText(/reg.label_phone/), '420123456789');
    await user.type(document.querySelector('input[name="password"]'), VALID_PASSWORD);
    await user.type(document.querySelector('input[name="confirm_password"]'), VALID_PASSWORD);

    expect(screen.getByRole('button', { name: 'reg.button_signup' })).toBeDisabled();

    await user.click(screen.getByRole('checkbox'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'reg.button_signup' })).not.toBeDisabled();
    });
  });

  it('shows Yup email validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateForm />);

    const emailInput = screen.getByLabelText(/reg.label_email/);
    await user.type(emailInput, 'not-an-email');
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText('validation.email.email')).toBeInTheDocument();
    });
  });

  it('calls registerSeller on valid submit', async () => {
    const user = userEvent.setup();
    registerSeller.mockResolvedValue({ data: {} });

    renderWithProviders(<CreateForm />);

    await user.type(screen.getByLabelText(/reg.label_first_name/), 'John');
    await user.type(screen.getByLabelText(/reg.label_last_name/), 'Doe');
    await user.type(screen.getByLabelText(/reg.label_email/), 'seller@example.com');
    await user.click(screen.getByLabelText(/reg.label_phone/));
    await user.type(screen.getByLabelText(/reg.label_phone/), '420123456789');
    await user.type(document.querySelector('input[name="password"]'), VALID_PASSWORD);
    await user.type(document.querySelector('input[name="confirm_password"]'), VALID_PASSWORD);
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'reg.button_signup' }));

    await waitFor(() => {
      expect(registerSeller).toHaveBeenCalled();
    });
  });
});
