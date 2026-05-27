import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { renderWithProviders } from "../../../test/test-utils.jsx";
import { reducer as productsReducer } from "../../../redux/productsSlice.js";
import { reducer as basketReducer } from "../../../redux/basketSlice.js";
import ProductNameRate from "./ProductNameRate.jsx";

vi.mock("react-responsive", () => ({
  useMediaQuery: vi.fn(() => false),
}));

vi.mock("../../Basket/BasketModal/BasketModal.jsx", () => ({
  default: () => null,
}));

const makeStore = (product) =>
  configureStore({
    reducer: {
      products: productsReducer,
      basket: basketReducer,
    },
    preloadedState: {
      products: {
        products: [],
        product,
        err: "",
        status: "fulfilled",
        category: 2,
        max: 10000000,
        min: 0,
        ordering: "price",
        page: 1,
        searchPage: 1,
        searchResult: {},
        searchStatus: null,
        count: null,
        categoryName: null,
        sellerResult: [],
        sellerStatus: null,
      },
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

const productWithVariants = {
  id: 42,
  name: "Variant product",
  rating: 5,
  total_reviews: 3,
  category_name: "Health",
  seller_id: 7,
  variants: [
    {
      sku: "SKU-A",
      price: "10.00",
      price_without_vat: "8.00",
      text: "Small",
      is_available: true,
      stock_status: "in_stock",
      available_quantity: 12,
    },
    {
      sku: "SKU-B",
      price: "12.00",
      price_without_vat: "9.60",
      text: "Large",
      is_available: false,
      stock_status: "out_of_stock",
      available_quantity: 0,
    },
  ],
};

describe("ProductNameRate stock availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("paths", JSON.stringify([]));
  });

  it("shows selected variant availability badge", () => {
    const store = makeStore(productWithVariants);
    renderWithProviders(<ProductNameRate />, {
      storeInstance: store,
      route: "/product/42?variant=SKU-A",
    });

    expect(screen.getByTestId("stock-badge")).toHaveAttribute(
      "data-stock-status",
      "in_stock"
    );
  });

  it("disables add to cart when selected variant is unavailable", async () => {
    const store = makeStore(productWithVariants);
    renderWithProviders(<ProductNameRate />, {
      storeInstance: store,
      route: "/product/42?variant=SKU-B",
    });

    const addButton = screen.getByRole("button", { name: "out_of_stock" });
    expect(addButton).toBeDisabled();
    expect(screen.getByTestId("stock-badge")).toHaveAttribute(
      "data-stock-status",
      "out_of_stock"
    );

    await userEvent.click(addButton);
    expect(store.getState().basket.basket).toHaveLength(0);
  });

  it("initializes selected sku after product loads", async () => {
    const store = makeStore({});
    renderWithProviders(<ProductNameRate />, {
      storeInstance: store,
      route: "/product/42",
    });

    store.dispatch({
      type: "products/fetchGetProductById/fulfilled",
      payload: { data: productWithVariants },
    });

    expect(await screen.findByTestId("stock-badge")).toHaveAttribute(
      "data-stock-status",
      "in_stock"
    );
    expect(screen.getByRole("button", { name: "add_basket" })).not.toBeDisabled();
  });
});
