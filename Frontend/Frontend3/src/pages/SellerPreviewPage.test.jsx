import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";

import { renderWithProviders } from "../test/test-utils.jsx";
import { setupStore } from "../redux/index.js";
import SellerPreviewPage from "./SellerPreviewPage";
import { buildSellerReviewData } from "../utils/sellerProductWizard";
import { getProductById } from "../api/productsApi";

vi.mock("react-responsive", () => ({ useMediaQuery: () => false }));

vi.mock("../Components/Seller/preview/SellerPreviewDesctop/SellerPreviewDesktop", () => ({
  default: ({ actionSlot }) => (
    <div data-testid="preview-desktop">{actionSlot}</div>
  ),
}));

vi.mock("../Components/Seller/preview/SellerPreviewMobile/SellerPreviewMobile", () => ({
  default: () => <div data-testid="preview-mobile" />,
}));

vi.mock("../Components/Seller/preview/SellerReviewProductLayout/SellerReviewActions", () => ({
  default: () => <div data-testid="review-actions" />,
}));

vi.mock("../hook/useActionCreatePrev", () => ({
  useActionCreatePrev: () => ({ fetchCreateProduct: vi.fn() }),
}));

vi.mock("../api/productsApi", () => ({ getProductById: vi.fn() }));

vi.mock("../utils/sellerProductWizard", () => ({
  buildSellerReviewData: vi.fn(() => ({ hasMissingRequiredAttributes: false })),
  formatApiErrorMessage: vi.fn((_data, fallback) => fallback),
  formatSellerWizardApiError: vi.fn(() => "step failed"),
  unwrapProductPreviewResponse: vi.fn((res) => res),
}));

const createPrevState = (overrides = {}) => ({
  status: null,
  previewProduct: null,
  createdProductId: null,
  submitStepResults: [],
  images: [],
  ...overrides,
});

describe("SellerPreviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildSellerReviewData.mockReturnValue({ hasMissingRequiredAttributes: false });
  });

  it("renders the desktop preview without warnings for a valid draft", () => {
    renderWithProviders(<SellerPreviewPage />, {
      storeInstance: setupStore({ create_prev: createPrevState() }),
    });

    expect(screen.getByTestId("preview-desktop")).toBeInTheDocument();
    expect(
      screen.queryByText(/Required category attributes are missing/)
    ).not.toBeInTheDocument();
  });

  it("shows a translation-protected warning when required attributes are missing", () => {
    buildSellerReviewData.mockReturnValue({ hasMissingRequiredAttributes: true });

    const { container } = renderWithProviders(<SellerPreviewPage />, {
      storeInstance: setupStore({ create_prev: createPrevState() }),
    });

    const warning = screen.getByText(/Required category attributes are missing/);
    expect(warning).toBeVisible();
    expect(container.querySelector("[translate='no']")).toBeInTheDocument();
  });

  it("renders a translation-protected partial-success banner", () => {
    renderWithProviders(<SellerPreviewPage />, {
      storeInstance: setupStore({
        create_prev: createPrevState({
          status: "partial_success",
          createdProductId: 42,
          submitStepResults: [{ step: "images", status: "rejected", error: {} }],
        }),
      }),
    });

    const banner = screen.getByText(/Product created with incomplete data/);
    expect(banner).toBeVisible();
    expect(banner.closest("[translate='no']")).toBeInTheDocument();
  });

  it("shows a protected loading state while fetching an existing product preview", () => {
    getProductById.mockReturnValue(new Promise(() => {}));

    renderWithProviders(
      <Routes>
        <Route path="/seller/seller-preview/:id" element={<SellerPreviewPage />} />
      </Routes>,
      {
        route: "/seller/seller-preview/123",
        storeInstance: setupStore({ create_prev: createPrevState() }),
      }
    );

    const loading = screen.getByText(/Loading product preview/);
    expect(loading.closest("[translate='no']")).toBeInTheDocument();
  });

  it("shows an error message when the product preview fails to load", async () => {
    getProductById.mockRejectedValue({ response: { data: {} } });

    renderWithProviders(
      <Routes>
        <Route path="/seller/seller-preview/:id" element={<SellerPreviewPage />} />
      </Routes>,
      {
        route: "/seller/seller-preview/123",
        storeInstance: setupStore({ create_prev: createPrevState() }),
      }
    );

    await waitFor(() =>
      expect(screen.getByText(/Unable to load product preview/)).toBeInTheDocument()
    );
  });
});
