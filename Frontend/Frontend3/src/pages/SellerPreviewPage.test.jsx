import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

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
  const originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, "location");

  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    buildSellerReviewData.mockReturnValue({ hasMissingRequiredAttributes: false });
  });

  afterEach(() => {
    if (originalLocationDescriptor) {
      Object.defineProperty(window, "location", originalLocationDescriptor);
    }
  });

  it("performs a single hard navigation to goods-list on create success", () => {
    const assignMock = vi.fn();
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign: assignMock, reload: reloadMock },
    });

    renderWithProviders(<SellerPreviewPage />, {
      storeInstance: setupStore({
        create_prev: createPrevState({ status: "fulfilled" }),
      }),
    });

    expect(assignMock).toHaveBeenCalledTimes(1);
    expect(assignMock).toHaveBeenCalledWith("/seller/goods-list");
    expect(navigateMock).not.toHaveBeenCalled();
    expect(reloadMock).not.toHaveBeenCalled();
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

  it("shows a translatable warning when required attributes are missing", () => {
    buildSellerReviewData.mockReturnValue({ hasMissingRequiredAttributes: true });

    renderWithProviders(<SellerPreviewPage />, {
      storeInstance: setupStore({ create_prev: createPrevState() }),
    });

    const warning = screen.getByText(/Required category attributes are missing/);
    expect(warning).toBeVisible();
    expect(warning.closest("[translate='no']")).toBeNull();
  });

  it("protects only technical tokens in the partial-success banner", () => {
    renderWithProviders(<SellerPreviewPage />, {
      storeInstance: setupStore({
        create_prev: createPrevState({
          status: "partial_success",
          createdProductId: 42,
          submitStepResults: [{ step: "images", status: "rejected", error: {} }],
        }),
      }),
    });

    expect(screen.getByText(/Product created with incomplete data/)).toBeVisible();
    expect(screen.getByText("42")).toHaveAttribute("translate", "no");
    expect(screen.getByText("images")).toHaveAttribute("translate", "no");
    expect(
      screen.getByText(/Failed steps can be retried/)
        .closest("[translate='no']")
    ).toBeNull();
  });

  it("shows a translatable loading state while fetching an existing product preview", () => {
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
    expect(loading.closest("[translate='no']")).toBeNull();
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
