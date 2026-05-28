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
  putPersonalData: vi.fn(),
}));

vi.mock('../../../../../api/seller/getOnboardingData', () => ({
  patchProfileUpdate: vi.fn(),
}));

vi.mock('../../identDocumInp/IdentDocumInp', () => ({
  default: () => <div data-testid="ident-doc-upload" />,
}));

import { renderWithProviders } from '../../../../../test/test-utils.jsx';
import PersonalDetails from './PersonalDetails.jsx';
import { validationSchemaSelf } from '../../../../../code/seller/validation';

function PersonalDetailsHarness() {
  const formik = useFormik({
    initialValues: {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      nationality: '',
      personal_phone: '',
      uploadFront: '',
      uploadBack: '',
    },
    validationSchema: validationSchemaSelf,
    onSubmit: vi.fn(),
  });

  return <PersonalDetails formik={formik} />;
}

describe('PersonalDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows required field errors after blur on empty inputs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PersonalDetailsHarness />, { route: '/seller/seller-info' });

    await user.click(screen.getByRole('textbox', { name: /onboard\.seller_info\.first_name/i }));
    await user.tab();

    await user.click(screen.getByRole('textbox', { name: /onboard\.seller_info\.last_name/i }));
    await user.tab();

    await user.click(screen.getByRole('textbox', { name: /onboard\.seller_info\.phone/i }));
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Phone number is required')).toBeInTheDocument();
    });
  });
});
