import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { renderWithProviders } from "../../../test/test-utils.jsx";
import { reducer as productsReducer } from "../../../redux/productsSlice.js";
import { reducer as basketReducer } from "../../../redux/basketSlice.js";
import { reducer as favoritesReducer } from "../../../redux/favoriteSlice.js";
import ProductCard from "./ProductCard.jsx";

vi.mock("react-responsive", () => ({
  useMediaQuery: vi.fn(() => false),
}));

vi.mock("../../../api/productsApi", () => ({
  getProductById: vi.fn().mockResolvedValue({
    data: {
      id: 1,
      seller_id: 10,
      variants: [{ sku: "SKU-1", price: "10.00", price_without_vat: "8.00" }],
    },
  }),
}));

vi.mock("../../../api/favorite", () => ({
  toggleFavorite: vi.fn(),
}));

vi.mock("../MobVariantDrawer/MobVariantDrawer.jsx", () => ({
  default: () => null,
}));

vi.mock("../../Basket/BasketModal/BasketModal.jsx", () => ({
  default: () => null,
}));

const makeStore = () =>
  configureStore({
    reducer: {
      products: productsReducer,
      basket: basketReducer,
      favorites: favoritesReducer,
    },
    preloadedState: {
      products: {
        products: [],
        product: {},
        err: "",
        status: "fulfilled",
        category: 2,
        max: 10000000,
        min: 0,
        ordering: "price",
        page: 1,
        searchPage: 1,
        searchResult: {},
        searchStatus: "fulfilled",
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
      favorites: {
        products: [],
        status: "fulfilled",
        error: null,
        page: 1,
        ordering: "popular",
        count: null,
      },
    },
  });

const baseProduct = {
  id: 1,
  name: "Sample product",
  price: "20.80",
  rating: 4,
  total_reviews: 12,
  image: "https://example.com/image.jpg",
  is_favorite: false,
};

describe("ProductCard stock availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders stock badge from API stock_status", () => {
    const store = makeStore();
    renderWithProviders(
      <ProductCard
        data={{
          ...baseProduct,
          stock_status: "in_stock",
          is_available: true,
          total_available_quantity: 10,
        }}
      />,
      { storeInstance: store }
    );

    expect(screen.getByTestId("stock-badge")).toHaveTextContent("in_stock");
    expect(screen.getByTestId("stock-badge")).toHaveAttribute(
      "data-stock-status",
      "in_stock"
    );
  });

  it("disables buy button when product is out of stock", async () => {
    const store = makeStore();
    renderWithProviders(
      <ProductCard
        data={{
          ...baseProduct,
          stock_status: "out_of_stock",
          is_available: false,
          total_available_quantity: 0,
        }}
      />,
      { storeInstance: store }
    );

    const buyButton = screen.getByRole("button", { name: "out_of_stock" });
    expect(buyButton).toBeDisabled();

    await userEvent.click(buyButton);
    expect(store.getState().basket.basket).toHaveLength(0);
  });
});
