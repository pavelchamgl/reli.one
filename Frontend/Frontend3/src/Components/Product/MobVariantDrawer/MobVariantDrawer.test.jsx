import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { renderWithProviders } from "../../../test/test-utils.jsx";
import { reducer as basketReducer } from "../../../redux/basketSlice.js";
import MobVariantDrawer from "./MobVariantDrawer.jsx";

vi.mock("@mui/material", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Drawer: ({ open, children }) => (open ? <div>{children}</div> : null),
  };
});

const variants = [
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

describe("MobVariantDrawer stock availability", () => {
  it("renders generic variants when varPack is null", () => {
    renderWithProviders(
      <MobVariantDrawer
        open
        handleClose={vi.fn()}
        allData={{ id: 1, seller_id: 2 }}
        variants={variants}
      />,
      { storeInstance: makeStore() }
    );

    expect(screen.getByText("Small")).toBeInTheDocument();
    expect(screen.getByText("out_of_stock")).toBeInTheDocument();
  });

  it("does not add unavailable variant to basket", async () => {
    const store = makeStore();

    renderWithProviders(
      <MobVariantDrawer
        open
        handleClose={vi.fn()}
        allData={{ id: 1, seller_id: 2, variants }}
        variants={variants}
      />,
      { storeInstance: store }
    );

    const unavailableButton = screen
      .getAllByRole("button")
      .find((button) => button.textContent.includes("Large"));

    await userEvent.click(unavailableButton);
    expect(store.getState().basket.basket).toHaveLength(0);
  });
});
