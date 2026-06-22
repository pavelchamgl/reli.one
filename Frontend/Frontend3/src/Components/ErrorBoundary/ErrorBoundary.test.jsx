import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import * as Sentry from "@sentry/react";

import ErrorBoundary from "./ErrorBoundary";

vi.mock("@sentry/react", () => {
  const scope = { setTag: vi.fn(), setContext: vi.fn() };
  return {
    withScope: vi.fn((cb) => cb(scope)),
    captureException: vi.fn(),
    __scope: scope,
  };
});

const Boom = () => {
  throw new Error("render boom");
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>safe content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("safe content")).toBeInTheDocument();
  });

  it("shows controlled fallback and logs to Sentry on render error", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary area="seller-product-wizard">
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reload/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.__scope.setTag).toHaveBeenCalledWith("area", "seller-product-wizard");
    expect(Sentry.__scope.setTag).toHaveBeenCalledWith(
      "translation_likely_active",
      expect.any(String)
    );

    consoleSpy.mockRestore();
  });

  it("protects the fallback container from automatic translation", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByRole("alert")).toHaveAttribute("translate", "no");

    consoleSpy.mockRestore();
  });
});
