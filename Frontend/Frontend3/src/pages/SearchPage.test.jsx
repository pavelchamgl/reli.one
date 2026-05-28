import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { renderWithProviders } from "../test/test-utils.jsx";
import { reducer as productsReducer } from "../redux/productsSlice.js";
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

// react-responsive: desktop by default (no MobFilter)
vi.mock("react-responsive", () => ({
  useMediaQuery: vi.fn(() => false),
}));

// Stub ProductCard — actual component is too coupled to test in isolation
vi.mock("../Components/Product/ProductCard/ProductCard.jsx", () => ({
  default: ({ data }) => (
    <div data-testid="product-card">{data?.name ?? "product"}</div>
  ),
}));

// Stub heavy filter/UI components to keep tests focused on SearchPage logic
vi.mock("../ui/FilterByPopularity/FilterByPopularity.jsx", () => ({
  default: () => <div data-testid="filter-popularity" />,
}));
vi.mock("../ui/FilterByPrice/FilterByPrice.jsx", () => ({
  default: () => <div data-testid="filter-price" />,
}));
vi.mock("../Components/MobFilter/MobFilter.jsx", () => ({
  default: () => <div data-testid="mob-filter" />,
}));
vi.mock("../ui/Container/Container.jsx", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

// Mock API default export (mainInstance) used by productsSlice thunks
vi.mock("../api/index.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      get: vi.fn().mockResolvedValue({ data: { results: [], count: 0 } }),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    },
  };
});

import SearchPage from "./SearchPage.jsx";

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Tests ────────────────────────────────────────────────────────────────────

describe("SearchPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    const store = makeStore();
    renderWithProviders(<SearchPage />, { storeInstance: store });
  });

  it("shows NoContentText when products list is empty", () => {
    const store = makeStore({ searchResult: { products: [], categories: [] } });
    renderWithProviders(<SearchPage />, { storeInstance: store });

    // NoContentText renders "noContent.title" (translation key returned as-is by mock)
    expect(screen.getByText("noContent.title")).toBeInTheDocument();
  });

  it("shows product cards when store has search results", () => {
    const store = makeStore({
      searchResult: {
        products: [
          { id: 1, name: "Alpha product" },
          { id: 2, name: "Beta product" },
        ],
        categories: [],
      },
      searchStatus: "fulfilled",
    });
    renderWithProviders(<SearchPage />, { storeInstance: store });

    expect(screen.getAllByTestId("product-card")).toHaveLength(2);
    expect(screen.getByText("Alpha product")).toBeInTheDocument();
    expect(screen.getByText("Beta product")).toBeInTheDocument();
  });

  it("shows search query title from URL param", () => {
    const store = makeStore();
    renderWithProviders(<SearchPage />, {
      route: "/?searchValue=laptop",
      storeInstance: store,
    });

    // SearchPage sets searchValue state from URL and renders it as <h3>
    // waitFor because useEffect sets the state asynchronously
    return waitFor(() => {
      expect(screen.getByText("laptop")).toBeInTheDocument();
    });
  });

  it("shows category tag when searchResult includes categories", () => {
    const store = makeStore({
      searchResult: {
        products: [],
        categories: [{ id: 1, name: "Electronics" }],
      },
    });
    renderWithProviders(<SearchPage />, { storeInstance: store });

    expect(screen.getByText("Kategorie: Electronics")).toBeInTheDocument();
  });

  it("does NOT show category tag when categories list is empty", () => {
    const store = makeStore({
      searchResult: { products: [], categories: [] },
    });
    renderWithProviders(<SearchPage />, { storeInstance: store });

    expect(screen.queryByText(/Kategorie:/)).not.toBeInTheDocument();
  });

  it("shows search-loading indicator when searchStatus is loading", () => {
    const store = makeStore({ searchStatus: "loading" });
    renderWithProviders(<SearchPage />, { storeInstance: store });

    expect(screen.getByTestId("search-loading")).toBeInTheDocument();
    expect(screen.queryByText("noContent.title")).not.toBeInTheDocument();
  });
});
