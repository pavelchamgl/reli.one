import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { renderWithProviders } from "../../../test/test-utils.jsx";
import { reducer as basketReducer } from "../../../redux/basketSlice.js";
import BasketModalCard from "./BasketModalCard.jsx";

vi.mock("react-responsive", () => ({
  useMediaQuery: vi.fn(() => false),
}));

vi.mock("../../../api/productsApi", () => ({
  getProductById: vi.fn(),
}));

vi.mock("../../../api/favorite", () => ({
  toggleFavorite: vi.fn(),
}));

const variants = [
  {
    sku: "SKU-A",
    price: "10.00",
    name: "Small",
    price_without_vat: "8.00",
    is_available: true,
    stock_status: "in_stock",
  },
  {
    sku: "SKU-B",
    price: "12.00",
    name: "Large",
    price_without_vat: "9.60",
    is_available: false,
    stock_status: "out_of_stock",
  },
];

const makeStore = () =>
  configureStore({
    reducer: { basket: basketReducer },
    preloadedState: {
      basket: {
        basket: [],
        baskets: [],
        err: "",
        status: "",
        totalCount: 0,
        selectedProducts: [],
        filteredBasket: null,
        searchTerm: "",
      },
    },
  });

describe("BasketModalCard stock availability", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getProductById } = await import("../../../api/productsApi");
    getProductById.mockResolvedValue({
      data: {
        id: 1,
        seller_id: 10,
        variants,
      },
    });
  });

  it("does not add unavailable variant when selected in modal", async () => {
    const store = makeStore();

    renderWithProviders(
      <BasketModalCard
        data={{ id: 1, name: "Sample", price: "10.00", is_favorite: false }}
        handleClose={vi.fn()}
        setMainCount={vi.fn()}
        setMainSku={vi.fn()}
      />,
      { storeInstance: store }
    );

    await waitFor(() => {
      expect(screen.getByText("Large")).toBeInTheDocument();
    });

    const unavailableButton = screen
      .getAllByRole("button")
      .find((button) => button.textContent.includes("Large"));

    await userEvent.click(unavailableButton);

    expect(
      store.getState().basket.basket.some((item) => item.sku === "SKU-B")
    ).toBe(false);
  });
});
