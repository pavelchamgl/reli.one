import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { renderWithProviders } from "../../test/test-utils.jsx";
import { reducer as authReducer } from "../../redux/authSlice.js";

const makeStore = (authState = { token: null }) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: authState },
  });

describe("ProtectedRoute", () => {
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
      { route: "/seller/secret", storeInstance: makeStore({ token: null }) },
    );
    expect(screen.queryByTestId("protected-child")).not.toBeInTheDocument();
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });

  it("renders children when access token is present in Redux state", () => {
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
      {
        route: "/seller/secret",
        storeInstance: makeStore({ token: { access: "test-access", refresh: "r" } }),
      },
    );
    expect(screen.getByTestId("protected-child")).toHaveTextContent("inside");
    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();
  });
});
