import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { renderWithProviders } from "../test/test-utils.jsx";
import { reducer as ordersReducer } from "../redux/ordersSlice.js";
import { reducer as authReducer } from "../redux/authSlice.js";

// ── Mocks ────────────────────────────────────────────────────────────────────

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

// Stub ActualSection — dispatches thunks on mount, complex inner components
vi.mock("../Components/Orders/ActualSeaction/ActualSection.jsx", () => ({
  default: () => <div data-testid="actual-section">ActualSection</div>,
}));

// Stub HistorySection
vi.mock("../Components/Orders/HistorySection/HistorySection.jsx", () => ({
  default: () => <div data-testid="history-section">HistorySection</div>,
}));

// Stub Container
vi.mock("../ui/Container/Container.jsx", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

import MyOrdersPage from "./MyOrdersPage.jsx";

// ── Store factory ─────────────────────────────────────────────────────────────

const makeStore = () =>
  configureStore({
    reducer: {
      orders: ordersReducer,
      auth: authReducer,
    },
  });

// ── Tests ────────────────────────────────────────────────────────────────────

describe("MyOrdersPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders without crashing", () => {
    renderWithProviders(<MyOrdersPage />, { storeInstance: makeStore() });
  });

  it("renders page title", () => {
    renderWithProviders(<MyOrdersPage />, { storeInstance: makeStore() });
    expect(screen.getByText("my_orders")).toBeInTheDocument();
  });

  it("renders 'current' and 'history' tab buttons", () => {
    renderWithProviders(<MyOrdersPage />, { storeInstance: makeStore() });
    expect(screen.getByText("current_tab")).toBeInTheDocument();
    expect(screen.getByText("history_tab")).toBeInTheDocument();
  });

  it("shows ActualSection by default (current tab active)", () => {
    renderWithProviders(<MyOrdersPage />, { storeInstance: makeStore() });
    expect(screen.getByTestId("actual-section")).toBeInTheDocument();
    expect(screen.queryByTestId("history-section")).not.toBeInTheDocument();
  });

  it("switches to HistorySection when history tab is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyOrdersPage />, { storeInstance: makeStore() });

    await user.click(screen.getByText("history_tab"));

    expect(screen.getByTestId("history-section")).toBeInTheDocument();
    expect(screen.queryByTestId("actual-section")).not.toBeInTheDocument();
  });

  it("switches back to ActualSection when current tab is clicked again", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyOrdersPage />, { storeInstance: makeStore() });

    await user.click(screen.getByText("history_tab"));
    await user.click(screen.getByText("current_tab"));

    expect(screen.getByTestId("actual-section")).toBeInTheDocument();
    expect(screen.queryByTestId("history-section")).not.toBeInTheDocument();
  });
});
