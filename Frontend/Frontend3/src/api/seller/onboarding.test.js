// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock("../index.js", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
  },
}));

import {
  handleError,
  getOnboardingStatus,
  postSubmitOnboarding,
  postSellerType,
  getReviewOnboarding,
} from "./onboarding.js";

// ─── handleError (pure function — no mock needed) ─────────────────────────────
//
// Testing handleError directly avoids Vitest 4.x unhandled-rejection noise that
// appears when a vi.fn() mock returns a rejected promise inside a vi.mock()
// context (even with .catch(() => {}) attached).  The API-function error tests
// below verify the happy path; error normalisation is covered here instead.

describe("handleError", () => {
  it("maps HTTP 4xx to { status, message } from response.data.message", () => {
    expect(() =>
      handleError({ response: { status: 401, data: { message: "Unauthorized" } } })
    ).toThrow();

    let err;
    try {
      handleError({ response: { status: 401, data: { message: "Unauthorized" } } });
    } catch (e) {
      err = e;
    }
    expect(err).toEqual({ status: 401, message: "Unauthorized" });
  });

  it("falls back to defaultMsg when response.data.message is absent", () => {
    let err;
    try {
      handleError({ response: { status: 500, data: {} } }, "Server error");
    } catch (e) {
      err = e;
    }
    expect(err).toEqual({ status: 500, message: "Server error" });
  });

  it("maps network-layer errors (no response) to server-unavailable", () => {
    let err;
    try {
      handleError({ request: {} });
    } catch (e) {
      err = e;
    }
    expect(err).toEqual({ status: null, message: "Server unavailable" });
  });

  it("maps unknown errors using error.message", () => {
    let err;
    try {
      handleError({ message: "Network Error" });
    } catch (e) {
      err = e;
    }
    expect(err).toEqual({ status: null, message: "Network Error" });
  });
});

// ─── getOnboardingStatus ───────────────────────────────────────────────────────

describe("getOnboardingStatus", () => {
  beforeEach(() => mockGet.mockReset());

  it("calls state endpoint and returns res.data", async () => {
    const payload = { status: "approved", can_submit: true };
    mockGet.mockResolvedValue({ data: payload });

    const result = await getOnboardingStatus();

    expect(mockGet).toHaveBeenCalledWith("/sellers/onboarding/state/");
    expect(result).toEqual(payload);
  });
});

// ─── postSubmitOnboarding ──────────────────────────────────────────────────────

describe("postSubmitOnboarding", () => {
  beforeEach(() => mockPost.mockReset());

  it("calls submit endpoint and returns res.data", async () => {
    const payload = { status: "pending_verification" };
    mockPost.mockResolvedValue({ data: payload });

    const result = await postSubmitOnboarding();

    expect(mockPost).toHaveBeenCalledWith("/sellers/onboarding/submit/");
    expect(result).toEqual(payload);
  });
});

// ─── postSellerType ────────────────────────────────────────────────────────────

describe("postSellerType", () => {
  beforeEach(() => mockPost.mockReset());

  it("posts self_employed type to the correct endpoint", async () => {
    mockPost.mockResolvedValue({ status: 200, data: {} });

    await postSellerType("self_employed");

    expect(mockPost).toHaveBeenCalledWith("/sellers/onboarding/seller-type/", {
      seller_type: "self_employed",
    });
  });

  it("posts company type to the correct endpoint", async () => {
    mockPost.mockResolvedValue({ status: 200, data: {} });

    await postSellerType("company");

    expect(mockPost).toHaveBeenCalledWith("/sellers/onboarding/seller-type/", {
      seller_type: "company",
    });
  });
});

// ─── getReviewOnboarding ───────────────────────────────────────────────────────

describe("getReviewOnboarding", () => {
  beforeEach(() => mockGet.mockReset());

  it("calls review endpoint and returns res.data", async () => {
    const payload = { personal_complete: "true", tax_complete: "false" };
    mockGet.mockResolvedValue({ data: payload });

    const result = await getReviewOnboarding();

    expect(mockGet).toHaveBeenCalledWith("/sellers/onboarding/review/");
    expect(result).toEqual(payload);
  });
});
