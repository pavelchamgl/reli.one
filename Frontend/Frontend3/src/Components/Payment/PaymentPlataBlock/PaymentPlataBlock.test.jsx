import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { renderWithProviders } from "../../../test/test-utils.jsx";
import PaymentPlataBlock from "./PaymentPlataBlock.jsx";
import { reducer as paymentReducer } from "../../../redux/paymentSlice.js";
import { reducer as basketReducer } from "../../../redux/basketSlice.js";
import { STOCK_CHECKOUT_ERROR_KEY } from "../../../utils/paymentErrors.js";

vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key) =>
        key === STOCK_CHECKOUT_ERROR_KEY
          ? "This item has just gone out of stock. Please refresh your cart."
          : key,
      i18n: { language: "en" },
    }),
  };
});

vi.mock("react-responsive", () => ({
  useMediaQuery: vi.fn(() => false),
}));

vi.mock("../MobPaymentBasket/MobPaymentBasket.jsx", () => ({
  default: () => null,
}));

vi.mock("../PaymentDeliveryInp/PaymentDeliveryInp.jsx", () => ({
  default: () => null,
}));

vi.mock("../PlataRadio/PlataRadio.jsx", () => ({
  default: () => null,
}));

vi.mock("../../../ui/PaymentAndBasketBreadcrumbs/PayAndCartBread.jsx", () => ({
  default: () => null,
}));

vi.mock("../../LoginModal/LoginModal.jsx", () => ({
  default: () => null,
}));

vi.mock("../ConfirmYourAgeModal/ConfirmYourAgeModal.jsx", () => ({
  default: () => null,
}));

describe("PaymentPlataBlock stock error message", () => {
  beforeEach(() => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem("confirm_rule", "true");
  });

  it("renders translated stock checkout error message", () => {
    const store = configureStore({
      reducer: {
        payment: paymentReducer,
        basket: basketReducer,
      },
      preloadedState: {
        payment: {
          paymentInfo: {
            email: "buyer@example.com",
            city: "Prague",
            street: "Main",
          },
          status: null,
          deliveryStatus: null,
          deliveryCost: null,
          deliveryType: null,
          deliveryCalculateErr: null,
          pointInfo: null,
          loading: false,
          error: STOCK_CHECKOUT_ERROR_KEY,
          delivery: [],
          selectedProducts: [],
          country: "cz",
          groups: [],
          pageSection: 3,
          isBuy: false,
        },
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

    renderWithProviders(
      <PaymentPlataBlock section={3} setSection={vi.fn()} />,
      { storeInstance: store }
    );

    expect(
      screen.getByText(
        "This item has just gone out of stock. Please refresh your cart."
      )
    ).toBeInTheDocument();
  });
});
