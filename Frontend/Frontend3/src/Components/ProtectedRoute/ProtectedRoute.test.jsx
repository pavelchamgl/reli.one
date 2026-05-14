import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { renderWithProviders } from "../../test/test-utils.jsx";

describe("ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("redirects to seller login when token is missing", () => {
    renderWithProviders(
      <Routes>
        <Route path="/seller/login" element={<div data-testid="login-page">login</div>} />
        <Route
          path="/seller/secret"
          element={
            <ProtectedRoute>
              <div data-testid="protected-child">inside</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: "/seller/secret" },
    );
    expect(screen.queryByTestId("protected-child")).not.toBeInTheDocument();
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });

  it("renders children when access token is present", () => {
    localStorage.setItem("token", JSON.stringify({ access: "test-access", refresh: "r" }));
    renderWithProviders(
      <Routes>
        <Route path="/seller/login" element={<div data-testid="login-page">login</div>} />
        <Route
          path="/seller/secret"
          element={
            <ProtectedRoute>
              <div data-testid="protected-child">inside</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: "/seller/secret" },
    );
    expect(screen.getByTestId("protected-child")).toHaveTextContent("inside");
    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();
  });
});
