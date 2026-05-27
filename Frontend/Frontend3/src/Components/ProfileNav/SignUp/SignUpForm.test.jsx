import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key) => key,
      i18n: { changeLanguage: vi.fn() },
    }),
  };
});

vi.mock("react-responsive", () => ({
  useMediaQuery: vi.fn(() => false),
}));

vi.mock("../../../api/auth", () => ({
  register: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { renderWithProviders } from "../../../test/test-utils.jsx";
import SignUpForm from "./SignUpForm.jsx";
import { register } from "../../../api/auth";

const VALID_PASSWORD = "Test1234!";
// SignUpForm Yup: 10–15 digits after stripping non-digits; input allows +digits only.
const VALID_PHONE = "420123456789";

const fillValidForm = async (user) => {
  await user.type(screen.getByRole("textbox", { name: /first_name/i }), "John");
  await user.type(screen.getByRole("textbox", { name: /surname/i }), "Doe");
  await user.type(
    screen.getByRole("textbox", { name: /sign_email/i }),
    "john@example.com"
  );
  await user.type(
    screen.getByRole("textbox", { name: /telefon/i }),
    VALID_PHONE
  );
  await user.type(
    document.querySelector('input[name="password"]'),
    VALID_PASSWORD
  );
  await user.type(
    document.querySelector('input[name="confirm_password"]'),
    VALID_PASSWORD
  );
  await user.click(document.querySelector('input[type="checkbox"]'));
};

describe("SignUpForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("shows Yup required errors after required fields are touched", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignUpForm />);

    const firstNameInput = screen.getByRole("textbox", { name: /first_name/i });
    await user.click(firstNameInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getAllByText("validation.name.required").length).toBeGreaterThan(0);
    });
  });

  it("shows invalid email validation error", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignUpForm />);

    const emailInput = screen.getByRole("textbox", { name: /sign_email/i });
    await user.type(emailInput, "bad-email");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText("validation.email.email")).toBeInTheDocument();
    });
  });

  it("shows weak password validation error", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignUpForm />);

    const passwordInput = document.querySelector('input[name="password"]');
    await user.type(passwordInput, "short");
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText("validation.password.passwordCriteria")
      ).toBeInTheDocument();
    });
  });

  it("calls register API with valid payload on submit", async () => {
    const user = userEvent.setup();
    register.mockResolvedValue({ data: { id: 1 } });

    renderWithProviders(<SignUpForm />);
    await fillValidForm(user);

    const submitBtn = screen.getByRole("button", { name: "sign_up" });
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    await user.click(submitBtn);

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        phone_number: `+${VALID_PHONE}`,
        password: VALID_PASSWORD,
        confirm_password: VALID_PASSWORD,
      });
    });
  });

  it("shows regErr when register API returns 400", async () => {
    const user = userEvent.setup();
    register.mockRejectedValue({
      response: {
        status: 400,
        data: { email: ["User with this email already exists."] },
      },
    });

    renderWithProviders(<SignUpForm />);
    await fillValidForm(user);

    const submitBtn = screen.getByRole("button", { name: "sign_up" });
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("email: User with this email already exists.")
      ).toBeInTheDocument();
    });
  });
});
