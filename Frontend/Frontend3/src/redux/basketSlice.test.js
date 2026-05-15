import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock side-effect modules before importing the slice
vi.mock("../ui/Toastify", () => ({
  ErrToast: vi.fn(),
}));

vi.mock("../analytics/analytics", () => ({
  trackAddToCart: vi.fn(),
}));

import {
  reducer,
  addToBasket,
  deleteFromBasket,
  selectProduct,
  selectAllProducts,
  deselectAllProducts,
  clearBasket,
  paymentEndBasket,
  plusCount,
  minusCount,
  plusCardCount,
  minusCardCount,
  basketSelectedProductsPrice,
  searchProducts,
  syncBasket,
  plusMinusDelivery,
  changeVariants,
} from "./basketSlice.js";
import { ErrToast } from "../ui/Toastify";

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeItem = (overrides = {}) => ({
  id: 1,
  sku: "SKU-001",
  count: 1,
  selected: false,
  product: { id: 1, name: "Widget", price: 10 },
  ...overrides,
});

const initialState = {
  basket: [],
  baskets: [],
  err: "",
  status: "",
  totalCount: 0,
  selectedProducts: [],
  filteredBasket: null,
  searchTerm: "",
};

// ── addToBasket ───────────────────────────────────────────────────────────────

describe("basketSlice — addToBasket", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds a new item to an empty basket", () => {
    const item = makeItem();
    const state = reducer(initialState, addToBasket(item));
    expect(state.basket).toHaveLength(1);
    expect(state.basket[0].sku).toBe("SKU-001");
  });

  it("does not add a duplicate sku", () => {
    const item = makeItem();
    let state = reducer(initialState, addToBasket(item));
    state = reducer(state, addToBasket(item));
    expect(state.basket).toHaveLength(1);
  });

  it("adds a second item with a different sku", () => {
    let state = reducer(initialState, addToBasket(makeItem({ sku: "SKU-001" })));
    state = reducer(state, addToBasket(makeItem({ sku: "SKU-002", id: 2 })));
    expect(state.basket).toHaveLength(2);
  });

  it("shows ErrToast when basket exceeds 55 items", () => {
    const fullBasket = Array.from({ length: 55 }, (_, i) =>
      makeItem({ sku: `SKU-${i}`, id: i })
    );
    const stateWith55 = { ...initialState, basket: fullBasket };
    reducer(stateWith55, addToBasket(makeItem({ sku: "SKU-new" })));
    expect(ErrToast).toHaveBeenCalledWith(
      "There should be no more than 55 items in the basket"
    );
  });
});

// ── deleteFromBasket ──────────────────────────────────────────────────────────

describe("basketSlice — deleteFromBasket", () => {
  it("removes item by sku", () => {
    const state = { ...initialState, basket: [makeItem({ sku: "SKU-001" })] };
    const next = reducer(state, deleteFromBasket({ sku: "SKU-001" }));
    expect(next.basket).toHaveLength(0);
  });

  it("subtracts from totalCount when deleted item was selected", () => {
    const item = makeItem({ sku: "A", selected: true, count: 2, product: { price: 5 } });
    const state = { ...initialState, basket: [item], totalCount: 10 };
    const next = reducer(state, deleteFromBasket({ sku: "A" }));
    expect(next.totalCount).toBe(0);
  });

  it("does NOT change totalCount when deleted item was not selected", () => {
    const item = makeItem({ sku: "B", selected: false, count: 2, product: { price: 5 } });
    const state = { ...initialState, basket: [item], totalCount: 20 };
    const next = reducer(state, deleteFromBasket({ sku: "B" }));
    expect(next.totalCount).toBe(20);
  });

  it("keeps other items intact", () => {
    const items = [
      makeItem({ sku: "A", id: 1 }),
      makeItem({ sku: "B", id: 2 }),
    ];
    const state = { ...initialState, basket: items };
    const next = reducer(state, deleteFromBasket({ sku: "A" }));
    expect(next.basket).toHaveLength(1);
    expect(next.basket[0].sku).toBe("B");
  });
});

// ── selectProduct ─────────────────────────────────────────────────────────────

describe("basketSlice — selectProduct", () => {
  it("selects item and adds price × count to totalCount", () => {
    const item = makeItem({ sku: "A", selected: false, count: 3, product: { price: 10 } });
    const state = { ...initialState, basket: [item], totalCount: 0 };
    const next = reducer(state, selectProduct({ sku: "A", selected: true }));
    expect(next.totalCount).toBe(30);
    expect(next.selectedProducts).toHaveLength(1);
  });

  it("deselects item and subtracts from totalCount", () => {
    const item = makeItem({ sku: "A", selected: true, count: 2, product: { price: 15 } });
    const state = { ...initialState, basket: [item], totalCount: 30 };
    const next = reducer(state, selectProduct({ sku: "A", selected: false }));
    expect(next.totalCount).toBe(0);
    expect(next.selectedProducts).toHaveLength(0);
  });

  it("does not affect other items", () => {
    const items = [
      makeItem({ sku: "A", selected: false, count: 1, product: { price: 5 } }),
      makeItem({ sku: "B", id: 2, selected: true, count: 1, product: { price: 10 } }),
    ];
    const state = { ...initialState, basket: items, totalCount: 10 };
    const next = reducer(state, selectProduct({ sku: "A", selected: true }));
    expect(next.basket.find(i => i.sku === "B").selected).toBe(true);
    expect(next.totalCount).toBe(15);
  });
});

// ── selectAllProducts / deselectAllProducts ───────────────────────────────────

describe("basketSlice — selectAllProducts", () => {
  it("marks all items selected and recalculates total", () => {
    const items = [
      makeItem({ sku: "A", count: 2, product: { price: 5 } }),
      makeItem({ sku: "B", id: 2, count: 1, product: { price: 10 } }),
    ];
    const state = { ...initialState, basket: items };
    const next = reducer(state, selectAllProducts());
    expect(next.basket.every(i => i.selected)).toBe(true);
    expect(next.selectedProducts).toHaveLength(2);
    expect(next.totalCount).toBe(20); // 2×5 + 1×10
  });
});

describe("basketSlice — deselectAllProducts", () => {
  it("marks all items deselected and zeros totalCount", () => {
    const items = [
      makeItem({ sku: "A", selected: true, count: 2, product: { price: 5 } }),
    ];
    const state = { ...initialState, basket: items, totalCount: 10 };
    const next = reducer(state, deselectAllProducts());
    expect(next.basket.every(i => !i.selected)).toBe(true);
    expect(next.totalCount).toBe(0);
    expect(next.selectedProducts).toHaveLength(0);
  });
});

// ── clearBasket ───────────────────────────────────────────────────────────────

describe("basketSlice — clearBasket", () => {
  it("resets basket, totalCount, selectedProducts and filteredBasket", () => {
    const dirty = {
      ...initialState,
      basket: [makeItem()],
      totalCount: 50,
      selectedProducts: [makeItem()],
      filteredBasket: [makeItem()],
    };
    const next = reducer(dirty, clearBasket());
    expect(next.basket).toHaveLength(0);
    expect(next.totalCount).toBe(0);
    expect(next.selectedProducts).toHaveLength(0);
    expect(next.filteredBasket).toBeNull();
  });
});

// ── paymentEndBasket ──────────────────────────────────────────────────────────

describe("basketSlice — paymentEndBasket", () => {
  it("removes only selected items", () => {
    const items = [
      makeItem({ sku: "A", selected: true }),
      makeItem({ sku: "B", id: 2, selected: false }),
    ];
    const state = { ...initialState, basket: items };
    const next = reducer(state, paymentEndBasket());
    expect(next.basket).toHaveLength(1);
    expect(next.basket[0].sku).toBe("B");
  });

  it("resets totalCount and selectedProducts", () => {
    const items = [makeItem({ sku: "A", selected: true })];
    const state = { ...initialState, basket: items, totalCount: 100, selectedProducts: items };
    const next = reducer(state, paymentEndBasket());
    expect(next.totalCount).toBe(0);
    expect(next.selectedProducts).toHaveLength(0);
  });
});

// ── plusCount / minusCount ────────────────────────────────────────────────────

describe("basketSlice — plusCount", () => {
  it("updates count for matching sku", () => {
    const item = makeItem({ sku: "X", count: 1, selected: true, product: { price: 10 } });
    const state = { ...initialState, basket: [item] };
    const next = reducer(state, plusCount({ sku: "X", count: 3 }));
    expect(next.basket[0].count).toBe(3);
  });

  it("recalculates totalCount for selected items", () => {
    const item = makeItem({ sku: "X", count: 1, selected: true, product: { price: 10 } });
    const state = { ...initialState, basket: [item] };
    const next = reducer(state, plusCount({ sku: "X", count: 2 }));
    expect(next.totalCount).toBe(20);
  });
});

describe("basketSlice — minusCount", () => {
  it("updates count for matching sku", () => {
    const item = makeItem({ sku: "Y", count: 3, selected: true, product: { price: 5 } });
    const state = { ...initialState, basket: [item] };
    const next = reducer(state, minusCount({ sku: "Y", count: 2 }));
    expect(next.basket[0].count).toBe(2);
    expect(next.totalCount).toBe(10);
  });
});

// ── plusCardCount / minusCardCount ────────────────────────────────────────────

describe("basketSlice — plusCardCount / minusCardCount", () => {
  it("plusCardCount updates count and recalculates selectedProducts totalCount", () => {
    const item = makeItem({ sku: "Z", count: 1, selected: true, product: { price: 8 } });
    const state = { ...initialState, basket: [item] };
    const next = reducer(state, plusCardCount({ sku: "Z", count: 4 }));
    expect(next.basket[0].count).toBe(4);
    expect(next.totalCount).toBe(32);
    expect(next.selectedProducts).toHaveLength(1);
  });

  it("minusCardCount updates count and recalculates totalCount", () => {
    const item = makeItem({ sku: "Z", count: 4, selected: true, product: { price: 8 } });
    const state = { ...initialState, basket: [item] };
    const next = reducer(state, minusCardCount({ sku: "Z", count: 2 }));
    expect(next.basket[0].count).toBe(2);
    expect(next.totalCount).toBe(16);
  });
});

// ── basketSelectedProductsPrice ───────────────────────────────────────────────

describe("basketSlice — basketSelectedProductsPrice", () => {
  it("recalculates totalCount from selectedProducts", () => {
    const selected = [
      makeItem({ sku: "A", count: 2, product: { price: 10 } }),
      makeItem({ sku: "B", id: 2, count: 1, product: { price: 20 } }),
    ];
    const state = { ...initialState, selectedProducts: selected, totalCount: 0 };
    const next = reducer(state, basketSelectedProductsPrice());
    expect(next.totalCount).toBe(40); // 2×10 + 1×20
  });
});

// ── searchProducts ────────────────────────────────────────────────────────────

describe("basketSlice — searchProducts", () => {
  it("filters basket by product name (case-insensitive)", () => {
    const items = [
      makeItem({ sku: "A", product: { name: "Widget Pro", price: 10 } }),
      makeItem({ sku: "B", id: 2, product: { name: "Gadget X", price: 20 } }),
    ];
    const state = { ...initialState, basket: items };
    const next = reducer(state, searchProducts({ text: "widget" }));
    expect(next.filteredBasket).toHaveLength(1);
    expect(next.filteredBasket[0].sku).toBe("A");
  });

  it("sets filteredBasket to null when search term is empty", () => {
    const state = {
      ...initialState,
      basket: [makeItem()],
      filteredBasket: [makeItem()],
    };
    const next = reducer(state, searchProducts({ text: "" }));
    expect(next.filteredBasket).toBeNull();
  });
});

// ── syncBasket ────────────────────────────────────────────────────────────────

describe("basketSlice — syncBasket", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("does nothing when email is not in localStorage", () => {
    const state = { ...initialState, basket: [makeItem()] };
    const next = reducer(state, syncBasket());
    // basket should remain unchanged if no email
    expect(next.baskets).toHaveLength(0);
  });

  it("creates a new baskets entry for a new email", () => {
    localStorage.setItem("email", JSON.stringify("user@example.com"));
    const item = makeItem();
    const state = { ...initialState, basket: [item] };
    const next = reducer(state, syncBasket());
    expect(next.baskets).toHaveLength(1);
    expect(next.baskets[0].email).toBe("user@example.com");
  });

  it("merges current basket into existing user basket", () => {
    localStorage.setItem("email", JSON.stringify("user@example.com"));
    const existing = makeItem({ sku: "EXISTING" });
    const newItem = makeItem({ sku: "NEW", id: 2 });
    const state = {
      ...initialState,
      basket: [newItem],
      baskets: [{ email: "user@example.com", basket: [existing] }],
    };
    const next = reducer(state, syncBasket());
    expect(next.basket).toHaveLength(2);
  });
});

// ── plusMinusDelivery ─────────────────────────────────────────────────────────

describe("basketSlice — plusMinusDelivery", () => {
  it("adds delivery price to totalCount", () => {
    const state = { ...initialState, totalCount: 100 };
    const next = reducer(state, plusMinusDelivery({ type: "plus", price: 15 }));
    expect(next.totalCount).toBe(115);
  });

  it("subtracts delivery price from totalCount", () => {
    const state = { ...initialState, totalCount: 100 };
    const next = reducer(state, plusMinusDelivery({ type: "minus", price: 15 }));
    expect(next.totalCount).toBe(85);
  });
});

// ── changeVariants ────────────────────────────────────────────────────────────

describe("basketSlice — changeVariants", () => {
  it("updates price and sku for matching item id", () => {
    const item = makeItem({ id: 5, sku: "OLD-SKU", product: { price: 10 } });
    const state = { ...initialState, basket: [item], selectedProducts: [item] };
    const next = reducer(
      state,
      changeVariants({ id: 5, price: 25, sku: "NEW-SKU" })
    );
    expect(next.basket[0].product.price).toBe(25);
    expect(next.basket[0].sku).toBe("NEW-SKU");
    expect(next.selectedProducts[0].product.price).toBe(25);
  });
});
