import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  RouterProvider,
  Outlet,
} from "react-router-dom";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";

const ACCOUNT_TYPE_TRANSLATIONS = {
  create_an_account: "Create an account",
  account_type_subtitle: "Choose how you would like to use Reli.one.",
  buyer_account_title: "Buyer account",
  seller_account_title: "Seller account",
  register_as_buyer: "Register as a buyer",
  become_a_seller: "Become a seller",
};

vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key) => ACCOUNT_TYPE_TRANSLATIONS[key] ?? key,
      i18n: { changeLanguage: vi.fn() },
    }),
  };
});

vi.mock("../../api/auth.js", () => ({
  login: vi.fn(),
}));

vi.mock("../Auth/googleAuth/GoogleAuth.jsx", () => ({
  default: () => <div data-testid="google-auth" />,
}));

vi.mock("../Auth/facebookAuth/FacebookAuth.jsx", () => ({
  default: () => <div data-testid="facebook-auth" />,
}));

vi.mock("../../hook/useActionPayment.js", () => ({
  useActionPayment: () => ({
    setIsBuy: vi.fn(),
    setPageSection: vi.fn(),
  }),
}));

import { renderWithProviders } from "../../test/test-utils.jsx";
import { setupStore } from "../../redux/index.js";
import i18nTest from "../../test/i18n-test.js";
import LoginModal from "./LoginModal.jsx";
import { login } from "../../api/auth.js";

const VALID_PASSWORD = "Test1234!";

function LoginModalHarness({ initialOpen = true, ...props }) {
  const [loginOpen, setLoginOpen] = useState(initialOpen);

  return (
    <LoginModal
      open={loginOpen}
      handleClose={() => setLoginOpen(false)}
      text="login_title"
      {...props}
    />
  );
}

function RouteChangeHarness() {
  const [loginOpen, setLoginOpen] = useState(true);

  return (
    <LoginModal
      open={loginOpen}
      handleClose={() => setLoginOpen(false)}
      text="login_title"
    />
  );
}

function PersistentLayoutHarness() {
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setLoginOpen(true)}>
        Open login
      </button>
      <LoginModal
        open={loginOpen}
        handleClose={() => setLoginOpen(false)}
        text="login_title"
      />
      <Outlet />
    </>
  );
}

function DualLoginModalLayoutHarness() {
  const [headerLoginOpen, setHeaderLoginOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setHeaderLoginOpen(true)}>
        Header login
      </button>
      <LoginModal
        open={headerLoginOpen}
        handleClose={() => setHeaderLoginOpen(false)}
        text="login_title"
      />
      <LoginModal open={false} handleClose={() => {}} text="login_title" />
      <Outlet />
    </>
  );
}

const renderLoginModal = (props = {}) =>
  renderWithProviders(<LoginModalHarness {...props} />);

const openAccountTypeModal = async (user, props = {}) => {
  renderLoginModal(props);
  await user.click(screen.getByRole("button", { name: "Create an account" }));
};

const expectAccountTypeModalVisible = () => {
  expect(screen.getByText("Choose how you would like to use Reli.one.")).toBeVisible();
  expect(screen.getByText("Buyer account")).toBeVisible();
  expect(screen.getByText("Seller account")).toBeVisible();
  expect(screen.getByRole("button", { name: "Register as a buyer" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Become a seller" })).toBeVisible();
};

const expectAccountTypeModalHidden = async () => {
  await waitFor(() => {
    expect(
      screen.queryByText("Choose how you would like to use Reli.one.")
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Register as a buyer" })).not.toBeInTheDocument();
    expect(document.querySelector(".MuiModal-backdrop")).not.toBeInTheDocument();
    expect(document.querySelector(".MuiBackdrop-root")).not.toBeInTheDocument();
    expect(document.body.style.overflow).not.toBe("hidden");
  });
};

const createPersistentLayoutRouter = (
  LayoutComponent = PersistentLayoutHarness,
  initialEntries = ["/"]
) =>
  createMemoryRouter(
    [
      {
        element: <LayoutComponent />,
        children: [
          { path: "/", element: <div>Home page</div> },
          { path: "/sign_up", element: <div>Sign up page</div> },
        ],
      },
    ],
    { initialEntries }
  );

const getAccountTypeCloseButton = () => {
  const closeButtons = screen.getAllByRole("button", { name: "close" });
  return closeButtons[closeButtons.length - 1];
};

describe("LoginModal", () => {
  let assignMock;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    assignMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location, assign: assignMock },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it("renders login form, forgot password link, and social login buttons", () => {
    renderLoginModal();

    expect(screen.getByRole("textbox", { name: /email_address/i })).toBeInTheDocument();
    expect(document.querySelector('input[name="password"]')).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "forgotten_password" })).toHaveAttribute(
      "href",
      "/email_pass_conf"
    );
    expect(screen.getByTestId("google-auth")).toBeInTheDocument();
    expect(screen.getByTestId("facebook-auth")).toBeInTheDocument();
  });

  it("closes LoginModal when close button is clicked", async () => {
    const user = userEvent.setup();

    renderLoginModal();

    await user.click(screen.getByRole("button", { name: "close" }));

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: /email_address/i })).not.toBeVisible();
    });
  });

  describe("AccountTypeModal", () => {
    it("opens when Create an account is clicked", async () => {
      const user = userEvent.setup();

      await openAccountTypeModal(user);

      expectAccountTypeModalVisible();
      expect(screen.queryByRole("textbox", { name: /email_address/i })).not.toBeInTheDocument();
    });

    it("closes when close button is clicked without navigation", async () => {
      const user = userEvent.setup();

      await openAccountTypeModal(user);

      await user.click(getAccountTypeCloseButton());

      await expectAccountTypeModalHidden();
      expect(assignMock).not.toHaveBeenCalled();
    });

    it("navigates to sign_up and closes modal when buyer option is selected", async () => {
      const user = userEvent.setup();
      const router = createPersistentLayoutRouter();

      render(
        <Provider store={setupStore()}>
          <I18nextProvider i18n={i18nTest}>
            <RouterProvider router={router} />
          </I18nextProvider>
        </Provider>
      );

      await user.click(screen.getByRole("button", { name: "Open login" }));
      await user.click(screen.getByRole("button", { name: "Create an account" }));
      expectAccountTypeModalVisible();

      await user.click(screen.getByRole("button", { name: "Register as a buyer" }));

      await expectAccountTypeModalHidden();
      expect(router.state.location.pathname).toBe("/sign_up");
      expect(screen.getByText("Sign up page")).toBeInTheDocument();
      expect(screen.queryByRole("textbox", { name: /email_address/i })).not.toBeInTheDocument();
    });

    it("closes AccountTypeModal on sign_up when LoginModal stays mounted like Header", async () => {
      const user = userEvent.setup();
      const router = createPersistentLayoutRouter(DualLoginModalLayoutHarness);

      render(
        <Provider store={setupStore()}>
          <I18nextProvider i18n={i18nTest}>
            <RouterProvider router={router} />
          </I18nextProvider>
        </Provider>
      );

      await user.click(screen.getByRole("button", { name: "Header login" }));
      await user.click(screen.getByRole("button", { name: "Create an account" }));
      expectAccountTypeModalVisible();

      await user.click(screen.getByRole("button", { name: "Register as a buyer" }));

      await expectAccountTypeModalHidden();
      expect(router.state.location.pathname).toBe("/sign_up");
      expect(screen.getByText("Sign up page")).toBeInTheDocument();
    });

    it("opens AccountTypeModal from LoginModal when already on /sign_up", async () => {
      const user = userEvent.setup();
      const router = createPersistentLayoutRouter(PersistentLayoutHarness, ["/sign_up"]);

      render(
        <Provider store={setupStore()}>
          <I18nextProvider i18n={i18nTest}>
            <RouterProvider router={router} />
          </I18nextProvider>
        </Provider>
      );

      expect(router.state.location.pathname).toBe("/sign_up");
      expect(screen.getByText("Sign up page")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Open login" }));
      await user.click(screen.getByRole("button", { name: "Create an account" }));

      expectAccountTypeModalVisible();
      expect(router.state.location.pathname).toBe("/sign_up");
    });

    it("closes AccountTypeModal and stays on /sign_up when buyer option is selected", async () => {
      const user = userEvent.setup();
      const router = createPersistentLayoutRouter(PersistentLayoutHarness, ["/sign_up"]);

      render(
        <Provider store={setupStore()}>
          <I18nextProvider i18n={i18nTest}>
            <RouterProvider router={router} />
          </I18nextProvider>
        </Provider>
      );

      await user.click(screen.getByRole("button", { name: "Open login" }));
      await user.click(screen.getByRole("button", { name: "Create an account" }));
      await user.click(screen.getByRole("button", { name: "Register as a buyer" }));

      await expectAccountTypeModalHidden();
      expect(router.state.location.pathname).toBe("/sign_up");
      expect(screen.getByText("Sign up page")).toBeInTheDocument();
    });

    it("redirects to seller signup from /sign_up and closes AccountTypeModal", async () => {
      const user = userEvent.setup();
      const router = createPersistentLayoutRouter(PersistentLayoutHarness, ["/sign_up"]);

      render(
        <Provider store={setupStore()}>
          <I18nextProvider i18n={i18nTest}>
            <RouterProvider router={router} />
          </I18nextProvider>
        </Provider>
      );

      await user.click(screen.getByRole("button", { name: "Open login" }));
      await user.click(screen.getByRole("button", { name: "Create an account" }));
      await user.click(screen.getByRole("button", { name: "Become a seller" }));

      expect(assignMock).toHaveBeenCalledWith(
        new URL("/seller/create-account", window.location.origin).toString()
      );
      await expectAccountTypeModalHidden();
    });

    it("navigates to seller signup and closes modal before external navigation", async () => {
      const user = userEvent.setup();

      await openAccountTypeModal(user);

      const accountTypeDialog = screen
        .getByText("Choose how you would like to use Reli.one.")
        .closest('[role="dialog"]');

      await user.click(screen.getByRole("button", { name: "Become a seller" }));

      await waitFor(() => {
        expect(
          within(accountTypeDialog).queryByText(
            "Choose how you would like to use Reli.one."
          )
        ).not.toBeInTheDocument();
      });
      expect(assignMock).toHaveBeenCalledWith(
        new URL("/seller/create-account", window.location.origin).toString()
      );
      await expectAccountTypeModalHidden();
    });

    it("closes on route change while AccountTypeModal is open", async () => {
      const user = userEvent.setup();

      const router = createMemoryRouter(
        [{ path: "*", element: <RouteChangeHarness /> }],
        { initialEntries: ["/"] }
      );

      render(
        <Provider store={setupStore()}>
          <I18nextProvider i18n={i18nTest}>
            <RouterProvider router={router} />
          </I18nextProvider>
        </Provider>
      );

      await user.click(screen.getByRole("button", { name: "Create an account" }));
      expectAccountTypeModalVisible();

      await router.navigate("/sign_up");

      await expectAccountTypeModalHidden();
      expect(router.state.location.pathname).toBe("/sign_up");
    });
  });
});
