import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { renderWithProviders } from "../../../test/test-utils.jsx";
import { reducer as basketReducer } from "../../../redux/basketSlice.js";
import BasketCard from "./BasketCard.jsx";

vi.mock("react-responsive", () => ({
  useMediaQuery: vi.fn(() => false),
}));

vi.mock("../../../api/productsApi", () => ({
  getProductById: vi.fn(),
}));

vi.mock("../../../api/favorite", () => ({
  toggleFavorite: vi.fn(),
}));

vi.mock("@mui/material", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Checkbox: ({ checked, onChange, disabled }) => (
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        data-testid="basket-checkbox"
      />
    ),
  };
});

const makeStore = () =>
  configureStore({
    reducer: { basket: basketReducer },
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
      },
    },
  });

const inStockVariant = {
  sku: "SKU-A",
  price: "10.00",
  price_without_vat: "8.00",
  name: "Small",
  is_available: true,
  stock_status: "in_stock",
};

const oosVariant = {
  sku: "SKU-B",
  price: "12.00",
  price_without_vat: "9.60",
  name: "Large",
  is_available: false,
  stock_status: "out_of_stock",
};

const productData = {
  id: 1,
  sku: "SKU-B",
  count: 1,
  selected: true,
  is_favorite: false,
  product: {
    id: 1,
    name: "Sample product",
    price: "12.00",
    variants: [inStockVariant, oosVariant],
  },
};

describe("BasketCard OOS detection", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getProductById } = await import("../../../api/productsApi");
    getProductById.mockResolvedValue({
      status: 200,
      data: {
        id: 1,
        variants: [inStockVariant, oosVariant],
      },
    });
  });

  it("shows out_of_stock badge when variant is OOS", async () => {
    renderWithProviders(
      <BasketCard
        productData={productData}
        section="basket"
        all={false}
      />,
      { storeInstance: makeStore() }
    );

    await waitFor(() => {
      expect(screen.getByTestId("stock-badge")).toBeInTheDocument();
    });
    expect(screen.getByTestId("stock-badge")).toHaveAttribute(
      "data-stock-status",
      "out_of_stock"
    );
  });

  it("disables +/- buttons when variant is OOS", async () => {
    renderWithProviders(
      <BasketCard
        productData={productData}
        section="basket"
        all={false}
      />,
      { storeInstance: makeStore() }
    );

    await waitFor(() => {
      expect(screen.getByTestId("stock-badge")).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole("button");
    const plusBtn = buttons.find((b) => b.textContent === "+");
    const minusBtn = buttons.find((b) => b.textContent === "-");
    expect(plusBtn).toBeDisabled();
    expect(minusBtn).toBeDisabled();
  });

  it("disables checkbox when variant is OOS", async () => {
    renderWithProviders(
      <BasketCard
        productData={productData}
        section="basket"
        all={false}
      />,
      { storeInstance: makeStore() }
    );

    await waitFor(() => {
      expect(screen.getByTestId("stock-badge")).toBeInTheDocument();
    });

    expect(screen.getByTestId("basket-checkbox")).toBeDisabled();
  });

  it("does not show OOS badge for in_stock variant", async () => {
    const { getProductById } = await import("../../../api/productsApi");
    getProductById.mockResolvedValueOnce({
      status: 200,
      data: { id: 1, variants: [inStockVariant, oosVariant] },
    });

    renderWithProviders(
      <BasketCard
        productData={{ ...productData, sku: "SKU-A" }}
        section="basket"
        all={false}
      />,
      { storeInstance: makeStore() }
    );

    await new Promise((r) => setTimeout(r, 100));
    expect(screen.queryByTestId("stock-badge")).not.toBeInTheDocument();
  });
});
