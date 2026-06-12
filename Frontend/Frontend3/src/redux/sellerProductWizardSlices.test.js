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
import { validateGoods } from "../code/validation/validationGoods.js";
import {
  areOptionalPackageDimensionsValid,
  CATEGORY_SCHEMA_NOT_READY_MESSAGE,
  formatVatRateForInput,
  mapEditVariantDraftToPatchPayload,
  mapVariantDraftToPayload,
  mapVariantApiToEditDraft,
  normalizeVatRate,
  validateProductImageFile,
  validateProductImageFiles,
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
      country_of_origin: "Czech Republic",
      warranty_months: "24",
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
      country_of_origin: "Czech Republic",
      warranty_months: 24,
    }));
    expect(postSellerProduct.mock.calls[0][0]).not.toHaveProperty("length_mm");
    expect(postSellerProduct.mock.calls[0][0]).not.toHaveProperty("width_mm");
    expect(postSellerProduct.mock.calls[0][0]).not.toHaveProperty("height_mm");
    expect(postSellerProduct.mock.calls[0][0]).not.toHaveProperty("weight_grams");
    expect(postSellerProduct.mock.calls[0][0]).not.toHaveProperty("countryOfOrigin");
    expect(postSellerProduct.mock.calls[0][0]).not.toHaveProperty("warranty");
    expect(postSellerProduct.mock.calls[0][0].article).toMatch(/^\d+$/);
  });

  it("maps empty VAT to zero in product create payload", async () => {
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
      vat_rate: "",
    }));

    const result = await store.dispatch(fetchCreateProduct());

    expect(result.type).toBe(fetchCreateProduct.fulfilled.type);
    expect(postSellerProduct).toHaveBeenCalledWith(expect.objectContaining({
      vat_rate: "0",
    }));
  });

  it("rejects invalid warranty months in form validation", async () => {
    await expect(validateGoods.validate({
      name: "Door",
      product_description: "Front door",
      warranty_months: "12.5",
    })).rejects.toThrow("Warranty must be a positive whole number");

    await expect(validateGoods.validate({
      name: "Door",
      product_description: "Front door",
      warranty_months: "12",
    })).resolves.toMatchObject({ warranty_months: "12" });
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

  it("maps edit product details and empty VAT to existing backend fields", async () => {
    patchProduct.mockResolvedValue({});
    const store = makeEditStore({
      edit_goods: {
        id: 77,
        category: null,
        categoryId: null,
        attributeSchema: null,
        attributeValues: {},
        attributeErrors: {},
        attributeSchemaStatus: "idle",
        attributeValuesStatus: "idle",
        name: "Door",
        product_description: "Desc",
        additional_details: "Seller notes",
        country_of_origin: "Poland",
        warranty_months: "36",
        barcode: "1234567890123",
        item: "1234567890",
        vat_rate: "",
        is_age: true,
        images: [],
        parameters: [],
        variantsName: "Style",
        variantsServ: [],
        license_file: null,
      },
    });

    const result = await store.dispatch(fetchEditProduct(77));

    expect(result.type).toBe(fetchEditProduct.fulfilled.type);
    expect(patchProduct).toHaveBeenCalledWith(77, expect.objectContaining({
      additional_details: "Seller notes",
      country_of_origin: "Poland",
      warranty_months: 36,
      barcode: "1234567890123",
      article: "1234567890",
      vat_rate: "0",
      is_age_restricted: true,
    }));
    expect(patchProduct.mock.calls[0][1]).not.toHaveProperty("countryOfOrigin");
    expect(patchProduct.mock.calls[0][1]).not.toHaveProperty("warranty");
  });
});

describe("seller product wizard helpers", () => {
  it("normalizes empty VAT to zero", () => {
    expect(normalizeVatRate("")).toBe("0");
    expect(normalizeVatRate(null)).toBe("0");
    expect(normalizeVatRate("21")).toBe("21");
  });

  it("formats backend zero VAT for input", () => {
    expect(formatVatRateForInput("0.00")).toBe("0");
    expect(formatVatRateForInput("20.00")).toBe("20");
    expect(formatVatRateForInput("20.50")).toBe("20.5");
  });

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

  it("blocks invalid product image formats before upload", () => {
    expect(validateProductImageFile(new File(["x"], "image.svg", { type: "image/svg+xml" }))).toBe(
      "Product images must be JPG, PNG, or WEBP."
    );
    expect(validateProductImageFile(new File(["x"], "video.mp4", { type: "video/mp4" }))).toBe(
      "Product images must be JPG, PNG, or WEBP."
    );
    expect(validateProductImageFile(new File(["x"], "image.jpg", { type: "image/jpeg" }))).toBeNull();
    expect(validateProductImageFile(new File(["x"], "image.png", { type: "image/png" }))).toBeNull();
    expect(validateProductImageFile(new File(["x"], "image.webp", { type: "image/webp" }))).toBeNull();
  });

  it("rejects mixed product image selection when any file is invalid", () => {
    expect(validateProductImageFiles([
      new File(["x"], "image.webp", { type: "image/webp" }),
      new File(["x"], "diagram.svg", { type: "image/svg+xml" }),
    ])).toBe("Product images must be JPG, PNG, or WEBP.");
  });
});
