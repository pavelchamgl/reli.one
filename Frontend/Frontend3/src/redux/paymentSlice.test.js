import { describe, it, expect, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { reducer as paymentReducer, fetchCreateStripeSession } from "./paymentSlice.js";
import { createStripeSession } from "../api/payment.js";
import {
  STOCK_CHECKOUT_ERROR_KEY,
  PAYMENT_ERROR_GENERIC_KEY,
} from "../utils/paymentErrors.js";

vi.mock("../api/payment.js", () => ({
  createStripeSession: vi.fn(),
  createPayPalSession: vi.fn(),
  calculateDelivery: vi.fn(),
}));

const makeStore = (overrides = {}) =>
  configureStore({
    reducer: {
      payment: paymentReducer,
    },
    preloadedState: {
      payment: {
        paymentInfo: {
          email: "buyer@example.com",
          name: "Buyer",
          surename: "Test",
          phone: "+420123",
          street: "Main",
          city: "Prague",
          zip: "11000",
          deliveryMethodDH: "dpd",
        },
        status: null,
        deliveryStatus: null,
        deliveryCost: null,
        deliveryType: null,
        deliveryCalculateErr: null,
        pointInfo: null,
        loading: false,
        error: null,
        delivery: [],
        selectedProducts: [],
        country: "cz",
        groups: [
          {
            seller_id: 1,
            deliveryType: "home_delivery",
            items: [{ sku: "SKU-1", count: 2 }],
          },
        ],
        pageSection: 3,
        isBuy: false,
        ...overrides,
      },
    },
  });

describe("paymentSlice checkout stock errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets stock checkout error key on 409 stock response", async () => {
    createStripeSession.mockRejectedValue({
      response: {
        status: 409,
        data: {
          stock: {
            sku: "SKU-1",
            requested: 2,
            available: 0,
          },
        },
      },
    });

    const store = makeStore();
    await store.dispatch(fetchCreateStripeSession());

    expect(store.getState().payment.error).toBe(STOCK_CHECKOUT_ERROR_KEY);
    expect(store.getState().payment.loading).toBe(false);
  });

  it("sets generic payment error key for other failures", async () => {
    createStripeSession.mockRejectedValue(new Error("Network Error"));

    const store = makeStore();
    await store.dispatch(fetchCreateStripeSession());

    expect(store.getState().payment.error).toBe(PAYMENT_ERROR_GENERIC_KEY);
  });
});
