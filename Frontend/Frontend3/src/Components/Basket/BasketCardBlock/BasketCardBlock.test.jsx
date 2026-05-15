import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { renderWithProviders } from "../../../test/test-utils.jsx";
import { reducer as basketReducer } from "../../../redux/basketSlice.js";
import { reducer as authReducer } from "../../../redux/authSlice.js";

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

vi.mock("react-responsive", () => ({
  useMediaQuery: vi.fn(() => false),
}));

// Stub BasketCard — it calls getProductById on mount and has many Redux deps
vi.mock("../BasketCard/BasketCard.jsx", () => ({
  default: ({ productData }) => (
    <div data-testid="basket-card">{productData?.product?.name}</div>
  ),
}));

// Stub PayAndCartBread — navigation breadcrumb, not under test
vi.mock("../../../ui/PaymentAndBasketBreadcrumbs/PayAndCartBread.jsx", () => ({
  default: () => <div data-testid="breadcrumb" />,
}));

// Stub Toastify (imported transitively via basketSlice)
vi.mock("../../../ui/Toastify", () => ({ ErrToast: vi.fn() }));
vi.mock("../../../analytics/analytics", () => ({ trackAddToCart: vi.fn() }));

import BasketCardBlock from "./BasketCardBlock.jsx";

// ── Store factory ─────────────────────────────────────────────────────────────

const makeStore = (basketOverrides = {}) =>
  configureStore({
    reducer: {
      basket: basketReducer,
      auth: authReducer,
    },
    preloadedState: {
      basket: {
        basket: [],
        baskets: [],
        err: "",
        status: "",
        totalCount: 0,
        selectedProducts: [],
        filteredBasket: null,
        searchTerm: "",
        ...basketOverrides,
      },
    },
  });

const makeItem = (overrides = {}) => ({
  id: 1,
  sku: "SKU-001",
  count: 1,
  selected: false,
  is_favorite: false,
  product: { id: 1, name: "Widget", price: 10 },
  ...overrides,
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("BasketCardBlock", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders without crashing", () => {
    renderWithProviders(<BasketCardBlock />, { storeInstance: makeStore() });
  });

  it("shows empty basket message when basket is empty", () => {
    renderWithProviders(<BasketCardBlock />, { storeInstance: makeStore() });
    expect(screen.getByText("basket_empty")).toBeInTheDocument();
  });

  it("renders basket cards for each item in basket", () => {
    const items = [
      makeItem({ sku: "SKU-001", product: { name: "Widget A", price: 10 } }),
      makeItem({ sku: "SKU-002", id: 2, product: { name: "Widget B", price: 20 } }),
    ];
    renderWithProviders(<BasketCardBlock />, {
      storeInstance: makeStore({ basket: items }),
    });
    expect(screen.getAllByTestId("basket-card")).toHaveLength(2);
    expect(screen.getByText("Widget A")).toBeInTheDocument();
    expect(screen.getByText("Widget B")).toBeInTheDocument();
  });

  it("shows item count in header", () => {
    const items = [makeItem(), makeItem({ sku: "SKU-002", id: 2 })];
    renderWithProviders(<BasketCardBlock />, {
      storeInstance: makeStore({ basket: items }),
    });
    // Format: "{count} count" — translation key returned as-is
    expect(screen.getByText("2 count")).toBeInTheDocument();
  });

  it("shows 'select all' label", () => {
    renderWithProviders(<BasketCardBlock />, { storeInstance: makeStore() });
    // The checkbox input has CSS module class — query by label text instead of role
    expect(screen.getByText("select_all")).toBeInTheDocument();
  });

  it("'select all' checkbox is unchecked when basket is empty", () => {
    renderWithProviders(<BasketCardBlock />, { storeInstance: makeStore() });
    // Use querySelector since CSS modules can affect role accessibility
    const checkbox = document.querySelector("input[type='checkbox']");
    expect(checkbox).not.toBeChecked();
  });

  it("'select all' checkbox is unchecked when items are not all selected", () => {
    const items = [
      makeItem({ sku: "A", selected: true }),
      makeItem({ sku: "B", id: 2, selected: false }),
    ];
    renderWithProviders(<BasketCardBlock />, {
      storeInstance: makeStore({ basket: items }),
    });
    const checkbox = document.querySelector("input[type='checkbox']");
    expect(checkbox).not.toBeChecked();
  });

  it("'select all' checkbox is checked when all items are selected", () => {
    const items = [
      makeItem({ sku: "A", selected: true }),
      makeItem({ sku: "B", id: 2, selected: true }),
    ];
    renderWithProviders(<BasketCardBlock />, {
      storeInstance: makeStore({ basket: items }),
    });
    const checkbox = document.querySelector("input[type='checkbox']");
    expect(checkbox).toBeChecked();
  });

  it("renders filteredBasket items when filteredBasket is non-empty", () => {
    const filtered = [makeItem({ sku: "F1", product: { name: "Filtered Item", price: 5 } })];
    const basket = [
      makeItem({ sku: "F1", product: { name: "Filtered Item", price: 5 } }),
      makeItem({ sku: "B2", id: 2, product: { name: "Other Item", price: 10 } }),
    ];
    renderWithProviders(<BasketCardBlock />, {
      storeInstance: makeStore({ basket, filteredBasket: filtered }),
    });
    // Only filtered items are rendered when filteredBasket is present
    expect(screen.getAllByTestId("basket-card")).toHaveLength(1);
    expect(screen.getByText("Filtered Item")).toBeInTheDocument();
  });
});
