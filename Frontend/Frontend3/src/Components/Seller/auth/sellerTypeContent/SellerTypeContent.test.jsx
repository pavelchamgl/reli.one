import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Preserve real initReactI18next (used by language/i18next.js on module load),
// but override useTranslation so components render translation keys as-is.
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

vi.mock("../../../../api/seller/onboarding", () => ({
  getOnboardingStatus: vi.fn(),
  postSellerType: vi.fn(),
}));

vi.mock("../../../../ui/Toastify", () => ({
  ErrToast: vi.fn(),
  AuthNeed: vi.fn(),
}));

import { renderWithProviders } from "../../../../test/test-utils.jsx";
import SellerTypeContent from "./SellerTypeContent.jsx";
import { getOnboardingStatus, postSellerType } from "../../../../api/seller/onboarding";
import { ErrToast } from "../../../../ui/Toastify";

describe("SellerTypeContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOnboardingStatus.mockResolvedValue({ status: "new", can_submit: false });
  });

  // ── Loading: getOnboardingStatus called on mount ──────────────────────────

  it("calls getOnboardingStatus on mount", async () => {
    renderWithProviders(<SellerTypeContent />);

    await waitFor(() => expect(getOnboardingStatus).toHaveBeenCalledTimes(1));
  });

  // ── Rendering type buttons ────────────────────────────────────────────────

  it("renders self_employed and company type buttons", () => {
    renderWithProviders(<SellerTypeContent />);

    expect(screen.getByText("onboard.selection.self_employed")).toBeInTheDocument();
    expect(screen.getByText("onboard.selection.company_legal")).toBeInTheDocument();
  });

  it("does not show continue button before a type is selected", () => {
    renderWithProviders(<SellerTypeContent />);

    expect(screen.queryByText("onboard.common.continue")).not.toBeInTheDocument();
  });

  // ── Type selection ────────────────────────────────────────────────────────

  it("shows continue button after selecting self_employed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SellerTypeContent />);

    await user.click(screen.getByText("onboard.selection.self_employed"));

    expect(screen.getByText("onboard.common.continue")).toBeInTheDocument();
  });

  it("shows continue button after selecting company", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SellerTypeContent />);

    await user.click(screen.getByText("onboard.selection.company_legal"));

    expect(screen.getByText("onboard.common.continue")).toBeInTheDocument();
  });

  // ── Submit: success ───────────────────────────────────────────────────────

  it("calls postSellerType with self_employed when continue is clicked", async () => {
    const user = userEvent.setup();
    postSellerType.mockResolvedValue({ status: 200, data: {} });
    renderWithProviders(<SellerTypeContent />);

    await user.click(screen.getByText("onboard.selection.self_employed"));
    await user.click(screen.getByText("onboard.common.continue"));

    await waitFor(() => expect(postSellerType).toHaveBeenCalledWith("self_employed"));
  });

  it("calls postSellerType with company when company type is selected", async () => {
    const user = userEvent.setup();
    postSellerType.mockResolvedValue({ status: 200, data: {} });
    renderWithProviders(<SellerTypeContent />);

    await user.click(screen.getByText("onboard.selection.company_legal"));
    await user.click(screen.getByText("onboard.common.continue"));

    await waitFor(() => expect(postSellerType).toHaveBeenCalledWith("company"));
  });

  // ── Submit: error handling ────────────────────────────────────────────────

  it("shows ErrToast when postSellerType rejects", async () => {
    const user = userEvent.setup();
    postSellerType.mockRejectedValue({ status: 401, message: "Auth required" });
    renderWithProviders(<SellerTypeContent />);

    await user.click(screen.getByText("onboard.selection.self_employed"));
    await user.click(screen.getByText("onboard.common.continue"));

    await waitFor(() => expect(ErrToast).toHaveBeenCalled());
  });

  // ── Status: pending_verification blocks submit and shows toast ────────────

  it("shows ErrToast when onboarding status is pending_verification", async () => {
    getOnboardingStatus.mockResolvedValue({ status: "pending_verification" });
    renderWithProviders(<SellerTypeContent />);

    await waitFor(() => expect(ErrToast).toHaveBeenCalled());
    expect(postSellerType).not.toHaveBeenCalled();
  });
});
