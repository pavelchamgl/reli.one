import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";

const ACCOUNT_TYPE_TRANSLATIONS = {
  create_an_account: "Create an account",
  account_type_subtitle: "Choose how you would like to use Reli.one.",
  buyer_account_title: "Buyer account",
  seller_account_title: "Seller account",
  register_as_buyer: "Register as a buyer",
  become_a_seller: "Become a seller",
  login: "login",
  email_address: "email_address",
  password: "password",
  forgotten_password: "forgotten_password",
  stay_logged_in: "stay_logged_in",
  continue: "continue",
  dont_have_acc: "dont_have_acc",
  other_ways_log: "other_ways_log",
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

vi.mock("../../../api/auth", () => ({
  login: vi.fn(),
}));

vi.mock("../../Auth/googleAuth/GoogleAuth.jsx", () => ({
  default: () => <div data-testid="google-auth" />,
}));

vi.mock("../../Auth/facebookAuth/FacebookAuth.jsx", () => ({
  default: () => <div data-testid="facebook-auth" />,
}));

vi.mock("../../../hook/useActionPayment", () => ({
  useActionPayment: () => ({
    setIsBuy: vi.fn(),
    setPageSection: vi.fn(),
  }),
}));

import { setupStore } from "../../../redux/index.js";
import i18nTest from "../../../test/i18n-test.js";
import MobLoginForm from "./MobLoginForm.jsx";

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
    expect(document.querySelector(".MuiBackdrop-root")).not.toBeInTheDocument();
  });
};

const renderMobLoginForm = (initialEntries = ["/mob_login"]) => {
  const router = createMemoryRouter(
    [
      { path: "/mob_login", element: <MobLoginForm /> },
      { path: "/sign_up", element: <div>Sign up page</div> },
    ],
    { initialEntries }
  );

  render(
    <Provider store={setupStore()}>
      <I18nextProvider i18n={i18nTest}>
        <RouterProvider router={router} />
      </I18nextProvider>
    </Provider>
  );

  return router;
};

describe("MobLoginForm", () => {
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

  it("renders login form, forgot password, and social auth", () => {
    renderMobLoginForm();

    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("password")).toBeInTheDocument();
    expect(screen.getByText("forgotten_password")).toBeInTheDocument();
    expect(screen.getByTestId("google-auth")).toBeInTheDocument();
    expect(screen.getByTestId("facebook-auth")).toBeInTheDocument();
  });

  it("opens AccountTypeModal when Create an account is clicked", async () => {
    const user = userEvent.setup();
    renderMobLoginForm();

    await user.click(screen.getByRole("button", { name: "Create an account" }));

    expectAccountTypeModalVisible();
  });

  it("navigates to sign_up and closes modal when buyer option is selected", async () => {
    const user = userEvent.setup();
    const router = renderMobLoginForm(["/mob_login"]);

    await user.click(screen.getByRole("button", { name: "Create an account" }));
    await user.click(screen.getByRole("button", { name: "Register as a buyer" }));

    await expectAccountTypeModalHidden();
    expect(router.state.location.pathname).toBe("/sign_up");
    expect(screen.getByText("Sign up page")).toBeInTheDocument();
  });

  it("redirects to seller signup and closes modal", async () => {
    const user = userEvent.setup();
    renderMobLoginForm();

    await user.click(screen.getByRole("button", { name: "Create an account" }));
    await user.click(screen.getByRole("button", { name: "Become a seller" }));

    expect(assignMock).toHaveBeenCalledWith(
      new URL("/seller/create-account", window.location.origin).toString()
    );
    await expectAccountTypeModalHidden();
  });

  it("closes AccountTypeModal when close button is clicked without navigation", async () => {
    const user = userEvent.setup();
    const router = renderMobLoginForm();

    await user.click(screen.getByRole("button", { name: "Create an account" }));
    await user.click(screen.getByRole("button", { name: "close" }));

    await expectAccountTypeModalHidden();
    expect(router.state.location.pathname).toBe("/mob_login");
    expect(assignMock).not.toHaveBeenCalled();
  });
});
