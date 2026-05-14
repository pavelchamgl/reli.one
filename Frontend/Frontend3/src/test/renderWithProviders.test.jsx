import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "./test-utils.jsx";

describe("renderWithProviders", () => {
  it("renders children with Redux and router context", () => {
    renderWithProviders(<div data-testid="smoke">ok</div>);
    expect(screen.getByTestId("smoke")).toHaveTextContent("ok");
  });
});
