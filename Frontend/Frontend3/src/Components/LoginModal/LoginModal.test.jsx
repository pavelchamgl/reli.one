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

vi.mock("../../api/auth.js", () => ({
  login: vi.fn(),
}));

vi.mock("../Auth/googleAuth/GoogleAuth.jsx", () => ({
  default: () => null,
}));

vi.mock("../Auth/facebookAuth/FacebookAuth.jsx", () => ({
  default: () => null,
}));

vi.mock("../../hook/useActionPayment.js", () => ({
  useActionPayment: () => ({
    setIsBuy: vi.fn(),
    setPageSection: vi.fn(),
  }),
}));

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { renderWithProviders } from "../../test/test-utils.jsx";
import LoginModal from "./LoginModal.jsx";
import { login } from "../../api/auth.js";

const VALID_PASSWORD = "Test1234!";

const renderLoginModal = (props = {}) =>
  renderWithProviders(
    <LoginModal
      open
      handleClose={vi.fn()}
      text="login_title"
      {...props}
    />
  );

describe("LoginModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("shows Yup required errors after empty fields are touched", async () => {
    const user = userEvent.setup();
    renderLoginModal();

    const emailInput = screen.getByRole("textbox", { name: /email_address/i });
    await user.click(emailInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText("validation.email.required")).toBeInTheDocument();
    });

    const passwordInput = document.querySelector('input[name="password"]');
    await user.click(passwordInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText("validation.password.required")).toBeInTheDocument();
    });
  });

  it("shows invalid email validation error", async () => {
    const user = userEvent.setup();
    renderLoginModal();

    const emailInput = screen.getByRole("textbox", { name: /email_address/i });
    await user.type(emailInput, "not-an-email");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText("validation.email.email")).toBeInTheDocument();
    });
  });

  it("shows weak password validation error", async () => {
    const user = userEvent.setup();
    renderLoginModal();

    const passwordInput = document.querySelector('input[name="password"]');
    await user.type(passwordInput, "weak");
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText("validation.password.passwordCriteria")
      ).toBeInTheDocument();
    });
  });

  it("calls login API with valid credentials on submit", async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({
      data: { access: "access-token", refresh: "refresh-token" },
    });

    renderLoginModal();

    await user.type(
      screen.getByRole("textbox", { name: /email_address/i }),
      "user@example.com"
    );
    await user.type(document.querySelector('input[name="password"]'), VALID_PASSWORD);
    await user.click(screen.getByRole("button", { name: "continue" }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: "user@example.com",
        password: VALID_PASSWORD,
      });
    });
  });

  it("shows regErr when login API returns 401", async () => {
    const user = userEvent.setup();
    login.mockRejectedValue({
      response: {
        status: 401,
        data: { detail: ["Invalid credentials"] },
      },
    });

    renderLoginModal();

    await user.type(
      screen.getByRole("textbox", { name: /email_address/i }),
      "user@example.com"
    );
    await user.type(document.querySelector('input[name="password"]'), VALID_PASSWORD);
    await user.click(screen.getByRole("button", { name: "continue" }));

    await waitFor(() => {
      expect(screen.getByText("detail: Invalid credentials")).toBeInTheDocument();
    });
  });
});
