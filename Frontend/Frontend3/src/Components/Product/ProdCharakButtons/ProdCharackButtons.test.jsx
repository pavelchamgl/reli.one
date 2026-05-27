import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../test/test-utils.jsx";
import ProdCharackButtons from "./ProdCharackButtons.jsx";

const genericVariants = [
  {
    sku: "SKU-A",
    price: "10.00",
    name: "Small",
    is_available: true,
    stock_status: "in_stock",
  },
  {
    sku: "SKU-B",
    price: "12.00",
    name: "Large",
    is_available: false,
    stock_status: "out_of_stock",
  },
];

describe("ProdCharackButtons stock availability", () => {
  it("renders real variants without text or image descriptors", () => {
    renderWithProviders(
      <ProdCharackButtons
        variants={genericVariants}
        setPrice={vi.fn()}
        setSku={vi.fn()}
        setPriceVat={vi.fn()}
        sku="SKU-A"
      />
    );

    expect(screen.getAllByText("Small").length).toBeGreaterThan(0);
    expect(screen.getByText("Large")).toBeInTheDocument();
    expect(screen.getByText("out_of_stock")).toBeInTheDocument();
  });

  it("does not select unavailable variant", async () => {
    const setSku = vi.fn();

    renderWithProviders(
      <ProdCharackButtons
        variants={genericVariants}
        setPrice={vi.fn()}
        setSku={setSku}
        setPriceVat={vi.fn()}
        sku="SKU-A"
      />
    );

    const unavailableButton = screen
      .getAllByRole("button")
      .find((button) => button.textContent.includes("Large"));

    await userEvent.click(unavailableButton);
    expect(setSku).not.toHaveBeenCalledWith("SKU-B");
  });
});
