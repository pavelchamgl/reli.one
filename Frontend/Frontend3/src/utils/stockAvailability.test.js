import { describe, it, expect } from "vitest";
import {
  canAddToBasket,
  getListItemStockSource,
  isItemAvailable,
} from "./stockAvailability.js";

describe("stockAvailability helpers", () => {
  it("prefers list stock fields over detail fallback", () => {
    const source = getListItemStockSource(
      { is_available: true, stock_status: "in_stock" },
      { is_available: false, stock_status: "out_of_stock" }
    );

    expect(isItemAvailable(source)).toBe(true);
  });

  it("falls back to detail stock when list item omits fields", () => {
    const source = getListItemStockSource(
      { id: 1, name: "Widget" },
      { is_available: false, stock_status: "out_of_stock" }
    );

    expect(isItemAvailable(source)).toBe(false);
  });

  it("allows legacy basket payload without stock fields", () => {
    expect(
      canAddToBasket({
        sku: "SKU-001",
        product: {
          id: 1,
          variants: [{ sku: "SKU-001", price: 10 }],
        },
      })
    ).toBe(true);
  });

  it("rejects out_of_stock basket payload", () => {
    expect(
      canAddToBasket({
        sku: "SKU-B",
        product: {
          id: 1,
          variants: [
            {
              sku: "SKU-B",
              is_available: false,
              stock_status: "out_of_stock",
            },
          ],
        },
      })
    ).toBe(false);
  });

  it("allows payload with empty sku (legacy item, no variant match)", () => {
    expect(
      canAddToBasket({
        sku: "",
        product: { id: 1, variants: [{ sku: "SKU-001", price: 10 }] },
      })
    ).toBe(true);
  });

  it("allows payload without product.variants (legacy path)", () => {
    expect(
      canAddToBasket({
        sku: "SKU-001",
        product: { id: 1, name: "Widget", price: 10 },
      })
    ).toBe(true);
  });

  it("uses product-level is_available when no variant match", () => {
    expect(
      canAddToBasket({
        sku: "UNKNOWN",
        product: { id: 1, is_available: false, stock_status: "out_of_stock" },
      })
    ).toBe(false);
  });
});
