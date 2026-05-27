import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { renderWithProviders } from "../test/test-utils.jsx";
import { reducer as productsReducer } from "../redux/productsSlice.js";
import { reducer as authReducer } from "../redux/authSlice.js";
import ProductPage from "./ProductPage.jsx";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParams: () => ({ id: "16" }),
  };
});

vi.mock("../hook/useAction.js", () => ({
  useActions: () => ({
    fetchGetProductById: vi.fn(),
    fetchGetComments: vi.fn(),
  }),
}));

vi.mock("react-responsive", () => ({
  useMediaQuery: vi.fn(() => false),
}));

vi.mock("../ui/Loader/Loader.jsx", () => ({
  default: () => <div data-testid="product-page-loader" />,
}));

vi.mock("../Components/Product/ProductNameRate/ProductNameRate.jsx", () => ({
  default: () => (
    <div data-testid="product-name-rate">
      <span>10 €</span>
      <button type="button">out_of_stock</button>
    </div>
  ),
}));

vi.mock("../Components/Product/ProductImages/ProductImages.jsx", () => ({
  default: () => <div data-testid="product-images" />,
}));
vi.mock("../Components/Product/ProductTab/ProductTab.jsx", () => ({
  default: () => <div data-testid="product-tab" />,
}));
vi.mock("../Components/Product/ProductCharakteristica/ProductCharak.jsx", () => ({
  default: () => <div data-testid="product-charak" />,
}));
vi.mock("../Components/Product/ProductComments/ProductComments.jsx", () => ({
  default: () => <div data-testid="product-comments" />,
}));
vi.mock("../ui/CustomBreadCrumps/CustomBreadCrumps.jsx", () => ({
  default: () => <div data-testid="product-breadcrumbs" />,
}));

const makeStore = (productOverrides = {}) =>
  configureStore({
    reducer: {
      products: productsReducer,
      auth: authReducer,
    },
    preloadedState: {
      products: {
        products: [],
        product: {},
        err: "",
        status: "",
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
        ...productOverrides,
      },
    },
  });

describe("ProductPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render default product UI when fetch failed", () => {
    renderWithProviders(<ProductPage />, {
      route: "/product/16",
      storeInstance: makeStore({ status: "error", product: {} }),
    });

    expect(screen.queryByTestId("product-name-rate")).not.toBeInTheDocument();
    expect(screen.queryByText("10 €")).not.toBeInTheDocument();
    expect(screen.queryByText("out_of_stock")).not.toBeInTheDocument();
    expect(screen.queryByTestId("product-page-loader")).not.toBeInTheDocument();
  });

  it("shows loader instead of default product UI before product is loaded", () => {
    renderWithProviders(<ProductPage />, {
      route: "/product/16",
      storeInstance: makeStore({ status: "", product: {} }),
    });

    expect(screen.getByTestId("product-page-loader")).toBeInTheDocument();
    expect(screen.queryByTestId("product-name-rate")).not.toBeInTheDocument();
    expect(screen.queryByText("10 €")).not.toBeInTheDocument();
    expect(screen.queryByText("out_of_stock")).not.toBeInTheDocument();
  });

  it("shows loader while product request is in flight", () => {
    renderWithProviders(<ProductPage />, {
      route: "/product/16",
      storeInstance: makeStore({ status: "loading", product: {} }),
    });

    expect(screen.getByTestId("product-page-loader")).toBeInTheDocument();
    expect(screen.queryByTestId("product-name-rate")).not.toBeInTheDocument();
  });

  it("renders product detail UI only after current product is loaded", () => {
    renderWithProviders(<ProductPage />, {
      route: "/product/16",
      storeInstance: makeStore({
        status: "fulfilled",
        product: {
          id: 16,
          name: "Wooden Puzzle Unidragon – Lovely Tiger",
          variants: [{ sku: "240819709", price: "72.70", is_available: true }],
        },
      }),
    });

    expect(screen.getByTestId("product-name-rate")).toBeInTheDocument();
    expect(screen.queryByTestId("product-page-loader")).not.toBeInTheDocument();
  });
});
