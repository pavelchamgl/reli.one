import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../ui/Toastify", () => ({
  ErrToast: vi.fn(),
}));

vi.mock("../api/seller/sellerProduct", () => ({
  postSellerImages: vi.fn(),
  postSellerLisence: vi.fn(),
  postSellerParameters: vi.fn(),
  postSellerProduct: vi.fn(),
  postSellerVariants: vi.fn(),
}));

vi.mock("../api/seller/sellerWizard", () => ({
  getSellerCategoryAttributeSchema: vi.fn(),
  putSellerProductAttributes: vi.fn(),
  putSellerVariantStock: vi.fn(),
}));

import {
  fetchCreateCategoryAttributeSchema,
  fetchCreateProduct,
  reducer as createReducer,
  setCategory as setCreateCategory,
} from "./createProdPrevSlice.js";
import {
  reducer as editReducer,
  setCategory as setEditCategory,
} from "./editGoodsSlice.js";
import { postSellerProduct } from "../api/seller/sellerProduct";
import { CATEGORY_SCHEMA_NOT_READY_MESSAGE } from "../utils/sellerProductWizard.js";

const makeCreateStore = () =>
  configureStore({
    reducer: {
      create_prev: createReducer,
    },
  });

describe("seller product wizard create guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks product create when category schema is missing", async () => {
    const store = makeCreateStore();
    store.dispatch(setCreateCategory({ id: 10, name: "Doors" }));

    const result = await store.dispatch(fetchCreateProduct());

    expect(result.type).toBe(fetchCreateProduct.rejected.type);
    expect(postSellerProduct).not.toHaveBeenCalled();
    expect(store.getState().create_prev.err).toBe(CATEGORY_SCHEMA_NOT_READY_MESSAGE);
    expect(store.getState().create_prev.attributeErrors.schema).toBe(CATEGORY_SCHEMA_NOT_READY_MESSAGE);
  });

  it("blocks product create when required typed attribute is empty", async () => {
    const store = makeCreateStore();
    store.dispatch(setCreateCategory({ id: 10, name: "Doors" }));
    store.dispatch({
      type: fetchCreateCategoryAttributeSchema.fulfilled.type,
      payload: {
        attributes: [
          {
            id: 501,
            code: "material",
            name: "Material",
            data_type: "text",
            is_required: true,
          },
        ],
      },
    });

    const result = await store.dispatch(fetchCreateProduct());

    expect(result.type).toBe(fetchCreateProduct.rejected.type);
    expect(postSellerProduct).not.toHaveBeenCalled();
    expect(store.getState().create_prev.attributeErrors[501]).toBe("This attribute is required.");
  });
});

describe("seller product wizard edit reducer", () => {
  it("clears stale typed attribute state when category changes", () => {
    const staleState = {
      id: 1,
      category: { id: 1, name: "Old" },
      categoryId: 1,
      attributeSchema: { attributes: [{ id: 1, name: "Old attribute" }] },
      attributeValues: { 1: "old value" },
      attributeErrors: { 1: "old error", schema: "old schema error" },
      attributeSchemaStatus: "fulfilled",
      attributeValuesStatus: "fulfilled",
    };

    const next = editReducer(staleState, setEditCategory({ id: 2, name: "New" }));

    expect(next.categoryId).toBe(2);
    expect(next.attributeSchema).toBeNull();
    expect(next.attributeValues).toEqual({});
    expect(next.attributeErrors).toEqual({});
    expect(next.attributeSchemaStatus).toBe("idle");
    expect(next.attributeValuesStatus).toBe("idle");
  });
});
