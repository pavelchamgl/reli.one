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

vi.mock("../api/seller/editProduct", () => ({
  getSellerProductById: vi.fn(),
  patchProduct: vi.fn(),
  patchSellerImages: vi.fn(),
}));

vi.mock("../api/seller/sellerWizard", () => ({
  getSellerCategoryAttributeSchema: vi.fn(),
  getSellerProductAttributes: vi.fn(),
  putSellerProductAttributes: vi.fn(),
  putSellerVariantStock: vi.fn(),
}));

import {
  fetchCreateCategoryAttributeSchema,
  fetchCreateProduct,
  reducer as createReducer,
  setCategory as setCreateCategory,
  setValues as setCreateValues,
} from "./createProdPrevSlice.js";
import {
  fetchEditProduct,
  reducer as editReducer,
  setCategory as setEditCategory,
} from "./editGoodsSlice.js";
import { postSellerProduct } from "../api/seller/sellerProduct";
import { patchProduct } from "../api/seller/editProduct";
import {
  areOptionalPackageDimensionsValid,
  CATEGORY_SCHEMA_NOT_READY_MESSAGE,
  mapEditVariantDraftToPatchPayload,
  mapVariantDraftToPayload,
  mapVariantApiToEditDraft,
  validateLicenseFile,
  validateLicenseFiles,
} from "../utils/sellerProductWizard.js";

const makeCreateStore = () =>
  configureStore({
    reducer: {
      create_prev: createReducer,
    },
  });

const makeEditStore = (preloadedState) =>
  configureStore({
    reducer: {
      edit_goods: editReducer,
    },
    preloadedState,
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

  it("builds product create payload without package dimensions", async () => {
    postSellerProduct.mockResolvedValue({ id: 123 });
    const store = makeCreateStore();
    store.dispatch(setCreateCategory({ id: 10, name: "Doors" }));
    store.dispatch({
      type: fetchCreateCategoryAttributeSchema.fulfilled.type,
      payload: { attributes: [] },
    });
    store.dispatch(setCreateValues({
      name: "Door",
      product_description: "Front door",
      additional_details: "Steel",
      item: "",
      barcode: "",
      vat_rate: "21",
      is_age: false,
      length: "100",
      width: "50",
      height: "10",
      weight: "3",
    }));

    const result = await store.dispatch(fetchCreateProduct());

    expect(result.type).toBe(fetchCreateProduct.fulfilled.type);
    expect(postSellerProduct).toHaveBeenCalledWith(expect.objectContaining({
      name: "Door",
      product_description: "Front door",
      category: 10,
      vat_rate: "21",
    }));
    expect(postSellerProduct.mock.calls[0][0]).not.toHaveProperty("length_mm");
    expect(postSellerProduct.mock.calls[0][0]).not.toHaveProperty("width_mm");
    expect(postSellerProduct.mock.calls[0][0]).not.toHaveProperty("height_mm");
    expect(postSellerProduct.mock.calls[0][0]).not.toHaveProperty("weight_grams");
    expect(postSellerProduct.mock.calls[0][0].article).toMatch(/^\d+$/);
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

describe("seller product wizard edit submit guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks edit save when required typed attribute is empty", async () => {
    const store = makeEditStore({
      edit_goods: {
        id: 77,
        category: { id: 10, name: "Doors" },
        categoryId: 10,
        attributeSchema: {
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
        attributeValues: {},
        attributeErrors: {},
        attributeSchemaStatus: "fulfilled",
        attributeValuesStatus: "fulfilled",
        name: "Door",
        product_description: "Desc",
        images: [],
        parameters: [],
        variantsName: "Style",
        variantsServ: [],
        license_file: null,
      },
    });

    const result = await store.dispatch(fetchEditProduct(77));

    expect(result.type).toBe(fetchEditProduct.rejected.type);
    expect(patchProduct).not.toHaveBeenCalled();
    expect(store.getState().edit_goods.attributeErrors[501]).toBe("This attribute is required.");
  });
});

describe("seller product wizard helpers", () => {
  it("maps backend package dimensions to edit kg/cm fields", () => {
    expect(
      mapVariantApiToEditDraft({
        id: 1,
        weight_grams: 1250,
        length_mm: 305,
        width_mm: 200,
        height_mm: 75,
      })
    ).toMatchObject({
      package_weight_kg: "1.25",
      package_length_cm: "30.5",
      package_width_cm: "20",
      package_height_cm: "7.5",
    });
  });

  it("maps create variant package dimensions to mm/g payload", () => {
    expect(
      mapVariantDraftToPayload({
        price: "99.90",
        text: "Black",
        weight: "1.25",
        length: "30.5",
        width: "20",
        height: "7.5",
      }, "Color")
    ).toMatchObject({
      price: "99.90",
      name: "Color",
      text: "Black",
      weight_grams: 1250,
      length_mm: 305,
      width_mm: 200,
      height_mm: 75,
    });
  });

  it("does not send empty package dimensions in edit patch payload", () => {
    expect(
      mapEditVariantDraftToPatchPayload(
        {
          id: 1,
          price: "10.00",
          text: "Black",
          image: null,
          package_weight_kg: "",
          package_length_cm: "",
          package_width_cm: "",
          package_height_cm: "",
        },
        "Color"
      )
    ).toEqual({
      price: "10.00",
      name: "Color",
      image: null,
      text: "Black",
    });
  });

  it("allows empty edit package dimensions for unrelated saves", () => {
    expect(
      areOptionalPackageDimensionsValid({
        package_weight_kg: "",
        package_length_cm: "",
        package_width_cm: null,
        package_height_cm: undefined,
      })
    ).toBe(true);
  });

  it("rejects filled invalid edit package dimensions", () => {
    expect(areOptionalPackageDimensionsValid({ package_weight_kg: "0" })).toBe(false);
    expect(areOptionalPackageDimensionsValid({ package_width_cm: "abc" })).toBe(false);
    expect(areOptionalPackageDimensionsValid({ package_height_cm: "-1" })).toBe(false);
    expect(areOptionalPackageDimensionsValid({ package_length_cm: "12.5" })).toBe(true);
  });

  it("blocks invalid license formats before upload", () => {
    expect(validateLicenseFile(new File(["x"], "license.jpg", { type: "image/jpeg" }))).toBe(
      "License file must be PDF or DOCX."
    );
    expect(validateLicenseFile(new File(["x"], "license.doc", { type: "application/msword" }))).toBe(
      "License file must be PDF or DOCX."
    );
    expect(validateLicenseFile(new File(["x"], "license.pdf", { type: "application/pdf" }))).toBeNull();
    expect(validateLicenseFile(new File(["x"], "license.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }))).toBeNull();
  });

  it("rejects mixed license selection when any file is invalid", () => {
    expect(validateLicenseFiles([
      new File(["x"], "license.pdf", { type: "application/pdf" }),
      new File(["x"], "photo.jpg", { type: "image/jpeg" }),
    ])).toBe("License file must be PDF or DOCX.");
  });

  it("allows single PDF or DOCX license selection", () => {
    expect(validateLicenseFiles([
      new File(["x"], "license.pdf", { type: "application/pdf" }),
    ])).toBeNull();
    expect(validateLicenseFiles([
      new File(["x"], "license.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    ])).toBeNull();
  });
});
