import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import * as Sentry from "@sentry/react";

import RouteErrorBoundary from "./RouteErrorBoundary";

vi.mock("@sentry/react", () => {
  const scope = { setTag: vi.fn(), setContext: vi.fn() };
  return {
    withScope: vi.fn((cb) => cb(scope)),
    captureException: vi.fn(),
    __scope: scope,
  };
});

const BoomRoute = () => {
  throw new Error("route render boom");
};

describe("RouteErrorBoundary", () => {
  it("shows controlled fallback instead of the default React Router error screen", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <BoomRoute />,
          errorElement: <RouteErrorBoundary area="app" />,
        },
      ],
      { initialEntries: ["/"] }
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reload/i })).toBeInTheDocument();
    expect(screen.queryByText(/Unexpected Application Error!/)).not.toBeInTheDocument();

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.__scope.setTag).toHaveBeenCalledWith("area", "app");
    expect(Sentry.__scope.setTag).toHaveBeenCalledWith(
      "translation_likely_active",
      "false"
    );

    consoleSpy.mockRestore();
  });
});
