import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useTranslation } from "react-i18next";

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
  getSellerVariantStock: vi.fn(),
  putSellerProductAttributes: vi.fn(),
  putSellerVariantStock: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: (key) => key,
  })),
}));

vi.mock("../../language/i18next", () => ({
  default: {
    t: (key) => key,
  },
}));

import SellerReviewActions from "../Components/Seller/preview/SellerReviewProductLayout/SellerReviewActions.jsx";
import SellerReviewDetailsSections, {
  LISTING_INFO_ROWS,
  LISTING_INFORMATION_TITLE_KEY,
} from "../Components/Seller/preview/SellerReviewProductLayout/SellerReviewDetailsSections.jsx";
import SellerReviewProductInfo from "../Components/Seller/preview/SellerReviewProductLayout/SellerReviewProductInfo.jsx";
import SellerReviewProductLayout from "../Components/Seller/preview/SellerReviewProductLayout/SellerReviewProductLayout.jsx";
import {
  fetchCreateCategoryAttributeSchema,
  fetchCreateProduct,
  reducer as createReducer,
  setCategory as setCreateCategory,
  setValues as setCreateValues,
} from "./createProdPrevSlice.js";
import {
  fetchEditCategoryAttributeSchema,
  fetchEditProduct,
  reducer as editReducer,
  setCategory as setEditCategory,
} from "./editGoodsSlice.js";
import { postSellerImages, postSellerProduct, postSellerVariants } from "../api/seller/sellerProduct";
import { putSellerVariantStock } from "../api/seller/sellerWizard";
import { patchProduct } from "../api/seller/editProduct";
import { validateGoods } from "../code/validation/validationGoods.js";
import {
  areOptionalPackageDimensionsValid,
  buildAttributePayload,
  buildSellerProductCreatePayload,
  buildSellerProductPatchPayload,
  buildSellerReviewData,
  CATEGORY_SCHEMA_NOT_READY_MESSAGE,
  formatApiErrorMessage,
  formatVatRateForInput,
  isProductVariantsValid,
  mapEditVariantDraftToPatchPayload,
  mapSellerProductVariantsForEdit,
  mapVariantDraftToPayload,
  mapProductParametersForReview,
  mapVariantApiToEditDraft,
  normalizeSellerArticle,
  normalizeBrandName,
  normalizeVatRate,
  openSellerDocumentUrl,
  REVIEW_STOCK_NOT_LOADED,
  unwrapProductPreviewResponse,
  validateProductImageFile,
  validateProductImageFiles,
  formatSellerWizardApiError,
  getBrandNameFieldError,
  LICENSE_MAX_BYTES,
  mapBrandNameApiError,
  mapLicenseApiError,
  translateSellerWizardError,
  validateLicenseFile,
  validateLicenseFiles,
  validateProductVariants,
  validateVariantDraft,
  valuesFromAttributeRows,
} from "../utils/sellerProductWizard.js";

const mmWidthAttribute = {
  id: 10,
  code: "door_width_mm",
  name: "Width",
  data_type: "number",
  unit: "mm",
};

describe("category attribute mm storage with mm input", () => {
  it("passes mm form values through to API payload (create and edit save)", () => {
    const payload = buildAttributePayload(
      [mmWidthAttribute],
      { 10: "800" }
    );

    expect(payload).toEqual([
      { attribute_definition: 10, value_number: "800" },
    ]);
  });

  it("loads mm API values into the edit form without conversion", () => {
    const values = valuesFromAttributeRows(
      [{ attribute_definition: 10, data_type: "number", value_number: "800" }],
      [mmWidthAttribute]
    );

    expect(values).toEqual({ 10: "800" });
  });

  it("strips trailing decimal zeros when loading mm API values", () => {
    expect(valuesFromAttributeRows(
      [{ attribute_definition: 10, data_type: "number", value_number: "800.0000" }],
      [mmWidthAttribute]
    )).toEqual({ 10: "800" });

    expect(valuesFromAttributeRows(
      [{ attribute_definition: 10, data_type: "number", value_number: "800,0000" }],
      [mmWidthAttribute]
    )).toEqual({ 10: "800" });
  });

  it("shows mm in seller review when form stores mm (create and edit preview)", () => {
    const review = buildSellerReviewData({
      attributeSchema: { attributes: [mmWidthAttribute] },
      attributeValues: { 10: "800" },
    });

    expect(review.categoryAttributes[0].display).toBe("800 mm");
  });

  it("preserves mm values on edit round-trip without double conversion", () => {
    const apiRow = { attribute_definition: 10, data_type: "number", value_number: "800" };
    const values = valuesFromAttributeRows([apiRow], [mmWidthAttribute]);
    const payload = buildAttributePayload([mmWidthAttribute], values);

    expect(values).toEqual({ 10: "800" });
    expect(payload).toEqual([
      { attribute_definition: 10, value_number: "800" },
    ]);
  });
});

const makeCreateStore = () =>
  configureStore({
    reducer: {
      create_prev: createReducer,
    },
  });

const validCreateVariant = (overrides = {}) => ({
  id: 1,
  text: "Black",
  price: "99.90",
  quantity_in_stock: "5",
  weight: "25.6",
  width: "800",
  height: "2060",
  length: "40",
  image: null,
  ...overrides,
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
      brand_name: "Samsung",
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
      variantsName: "Color",
      variantsMain: [validCreateVariant()],
    }));

    const result = await store.dispatch(fetchCreateProduct());

    expect(result.type).toBe(fetchCreateProduct.fulfilled.type);
    expect(postSellerProduct).toHaveBeenCalledWith(expect.objectContaining({
      name: "Door",
      brand_name: "Samsung",
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
    expect(postSellerProduct.mock.calls[0][0].article).toMatch(/^\d{10}$/);
  });

  it("omits brand_name from create payload when brand field is empty", async () => {
    postSellerProduct.mockResolvedValue({ id: 123 });
    const store = makeCreateStore();
    store.dispatch(setCreateCategory({ id: 10, name: "Doors" }));
    store.dispatch({
      type: fetchCreateCategoryAttributeSchema.fulfilled.type,
      payload: { attributes: [] },
    });
    store.dispatch(setCreateValues({
      name: "Door",
      brand_name: "   ",
      product_description: "Front door",
      vat_rate: "21",
      variantsName: "Color",
      variantsMain: [validCreateVariant()],
    }));

    const result = await store.dispatch(fetchCreateProduct());

    expect(result.type).toBe(fetchCreateProduct.fulfilled.type);
    expect(postSellerProduct.mock.calls[0][0]).not.toHaveProperty("brand_name");
  });

  it("buildSellerProductCreatePayload omits empty brand_name", () => {
    const payload = buildSellerProductCreatePayload({
      name: "Door",
      brand_name: "  ",
      product_description: "Desc",
      barcode: "",
      item: "",
      additional_details: "",
      country_of_origin: "",
      warranty_months: "",
      vat_rate: "21",
      is_age: false,
      category: { id: 10 },
    });

    expect(payload).not.toHaveProperty("brand_name");
    expect(payload.name).toBe("Door");
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
      brand_name: "Samsung",
      product_description: "Front door",
      vat_rate: "",
      variantsName: "Color",
      variantsMain: [validCreateVariant()],
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
      brand_name: "Samsung",
      product_description: "Front door",
      warranty_months: "12.5",
    })).rejects.toThrow("Warranty must be a positive whole number");

    await expect(validateGoods.validate({
      name: "Door",
      brand_name: "Samsung",
      product_description: "Front door",
      warranty_months: "12",
    })).resolves.toMatchObject({ warranty_months: "12" });
  });

  it("normalizes brand name and rejects invalid values", async () => {
    expect(normalizeBrandName("  Samsung   Galaxy  ")).toBe("Samsung Galaxy");

    await expect(validateGoods.validate({
      name: "Door",
      brand_name: "",
      product_description: "Front door",
    })).resolves.toMatchObject({ brand_name: "" });

    await expect(validateGoods.validate({
      name: "Door",
      brand_name: "A",
      product_description: "Front door",
    })).rejects.toThrow("Brand must be at least 2 characters");

    await expect(validateGoods.validate({
      name: "Door",
      brand_name: "Samsung",
      product_description: "Front door",
    })).resolves.toMatchObject({ brand_name: "Samsung" });
  });

  it("maps brand API error codes to i18n keys", () => {
    const t = (key) => key;
    expect(mapBrandNameApiError("brand_min_length", t)).toBe("goods.validation.brandMinLength");
    expect(mapBrandNameApiError("brand_max_length", t)).toBe("goods.validation.brandMaxLength");
    expect(getBrandNameFieldError({ brand_name: ["brand_min_length"] }, t)).toBe(
      "goods.validation.brandMinLength"
    );
  });
});

describe("seller product wizard create reducer", () => {
  it("keeps typed attribute values when category is re-set to the same id", () => {
    const staleState = {
      category: { id: 7, name: "Entrance Doors" },
      category_name: "Entrance Doors",
      attributeSchema: { attributes: [{ id: 501, name: "Door material" }] },
      attributeValues: { 501: "Steel" },
      attributeErrors: {},
      attributeSchemaStatus: "fulfilled",
    };

    const next = createReducer(
      staleState,
      setCreateCategory({ id: 7, name: "Entrance Doors" })
    );

    expect(next.attributeValues).toEqual({ 501: "Steel" });
    expect(next.attributeSchema).toEqual(staleState.attributeSchema);
    expect(next.attributeSchemaStatus).toBe("fulfilled");
  });

  it("clears typed attribute state when create category changes", () => {
    const staleState = {
      category: { id: 7, name: "Entrance Doors" },
      attributeSchema: { attributes: [{ id: 501, name: "Door material" }] },
      attributeValues: { 501: "Steel" },
      attributeErrors: { 501: "Required" },
      attributeSchemaStatus: "fulfilled",
    };

    const next = createReducer(
      staleState,
      setCreateCategory({ id: 8, name: "Windows" })
    );

    expect(next.category.id).toBe(8);
    expect(next.attributeValues).toEqual({});
    expect(next.attributeSchema).toBeNull();
    expect(next.attributeSchemaStatus).toBe("idle");
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

  it("stores edit category schema API errors as render-safe strings", () => {
    const next = editReducer(undefined, {
      type: fetchEditCategoryAttributeSchema.rejected.type,
      payload: { detail: "Schema is unavailable." },
    });

    expect(next.attributeSchemaStatus).toBe("rejected");
    expect(next.attributeErrors.schema).toBe("Schema is unavailable.");
    expect(typeof next.attributeErrors.schema).toBe("string");
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
        brand_name: "Philips",
        originalBrandName: "Philips",
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
    expect(patchProduct.mock.calls[0][1]).not.toHaveProperty("brand_name");
    expect(patchProduct.mock.calls[0][1]).not.toHaveProperty("countryOfOrigin");
    expect(patchProduct.mock.calls[0][1]).not.toHaveProperty("warranty");
  });

  it("omits brand_name from edit patch when brand is unchanged", async () => {
    patchProduct.mockResolvedValue({});
    const store = makeEditStore({
      edit_goods: {
        id: 77,
        categoryId: 10,
        attributeSchema: { attributes: [] },
        attributeSchemaStatus: "fulfilled",
        attributeValues: {},
        attributeErrors: {},
        name: "Door",
        brand_name: "Samsung",
        originalBrandName: "Samsung",
        product_description: "Desc",
        item: "1234567890",
        vat_rate: "21",
        images: [],
        parameters: [],
        variantsServ: [],
      },
    });

    await store.dispatch(fetchEditProduct(77));

    expect(patchProduct.mock.calls[0][1]).not.toHaveProperty("brand_name");
  });

  it("sends empty brand_name on edit patch when brand is cleared", async () => {
    patchProduct.mockResolvedValue({});
    const store = makeEditStore({
      edit_goods: {
        id: 77,
        categoryId: 10,
        attributeSchema: { attributes: [] },
        attributeSchemaStatus: "fulfilled",
        attributeValues: {},
        attributeErrors: {},
        name: "Door",
        brand_name: "",
        originalBrandName: "Samsung",
        product_description: "Desc",
        item: "1234567890",
        vat_rate: "21",
        images: [],
        parameters: [],
        variantsServ: [],
      },
    });

    await store.dispatch(fetchEditProduct(77));

    expect(patchProduct.mock.calls[0][1]).toMatchObject({ brand_name: "" });
  });

  it("sends new brand_name on edit patch when brand is changed", async () => {
    patchProduct.mockResolvedValue({});
    const store = makeEditStore({
      edit_goods: {
        id: 77,
        categoryId: 10,
        attributeSchema: { attributes: [] },
        attributeSchemaStatus: "fulfilled",
        attributeValues: {},
        attributeErrors: {},
        name: "Door",
        brand_name: "Sony",
        originalBrandName: "Samsung",
        product_description: "Desc",
        item: "1234567890",
        vat_rate: "21",
        images: [],
        parameters: [],
        variantsServ: [],
      },
    });

    await store.dispatch(fetchEditProduct(77));

    expect(patchProduct.mock.calls[0][1]).toMatchObject({ brand_name: "Sony" });
  });

  it("buildSellerProductPatchPayload omits brand when legacy product had no brand and field is empty", () => {
    const payload = buildSellerProductPatchPayload({
      name: "Door",
      brand_name: "",
      originalBrandName: "",
      product_description: "Desc",
      categoryId: 10,
      item: "1234567890",
      vat_rate: "21",
      is_age: false,
    });

    expect(payload).not.toHaveProperty("brand_name");
  });
});

describe("seller product wizard helpers", () => {
  it("formats API error objects for UI rendering", () => {
    expect(formatApiErrorMessage({ detail: "Not found" }, "Fallback")).toBe("Not found");
    expect(formatApiErrorMessage({ field: ["A", "B"] }, "Fallback")).toBe("field: A, B");
    expect(formatApiErrorMessage(["A", { detail: "B" }], "Fallback")).toBe("A, B");
    expect(formatApiErrorMessage(null, "Fallback")).toBe("Fallback");
    expect(formatApiErrorMessage({}, "Fallback")).toBe("Fallback");
  });

  it("normalizes empty VAT to zero", () => {
    expect(normalizeVatRate("")).toBe("0");
    expect(normalizeVatRate(null)).toBe("0");
    expect(normalizeVatRate("21")).toBe("21");
  });

  it("normalizes seller article to exactly 10 digits", () => {
    expect(normalizeSellerArticle("1234567890")).toBe("1234567890");
    expect(normalizeSellerArticle("")).toMatch(/^\d{10}$/);
    expect(normalizeSellerArticle(undefined)).toMatch(/^\d{10}$/);
  });

  it("opens draft license data urls in a new tab through blob urls", () => {
    let openedAnchor = null;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function clickMock() {
      openedAnchor = this;
    });
    const createObjectURL = vi.fn(() => "blob:license");
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL: vi.fn() });

    openSellerDocumentUrl("data:application/pdf;base64,ZmFrZQ==");

    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(openedAnchor?.href).toBe("blob:license");
    expect(openedAnchor?.target).toBe("_blank");
    expect(openedAnchor?.rel).toBe("noopener noreferrer");

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("formats backend zero VAT for input", () => {
    expect(formatVatRateForInput("0.00")).toBe("0");
    expect(formatVatRateForInput("20.00")).toBe("20");
    expect(formatVatRateForInput("20.50")).toBe("20.5");
  });

  it("maps backend package dimensions to edit kg/mm fields", () => {
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
      package_length_mm: "305",
      package_width_mm: "200",
      package_height_mm: "75",
    });
  });

  it("preserves zero mm dimensions when mapping variant api to edit draft", () => {
    expect(
      mapVariantApiToEditDraft({
        id: 1,
        width_mm: 0,
        length_mm: 0,
        height_mm: 0,
      })
    ).toMatchObject({
      package_width_mm: "0",
      package_length_mm: "0",
      package_height_mm: "0",
    });
  });

  it("maps create variant package dimensions to mm/g payload", () => {
    expect(
      mapVariantDraftToPayload({
        price: "99.90",
        text: "Black",
        image: "data:image/png;base64,abc",
        weight: "1.25",
        length: "305",
        width: "200",
        height: "75",
      }, "Color")
    ).toMatchObject({
      price: "99.90",
      name: "Color",
      text: "Black",
      image: "data:image/png;base64,abc",
      weight_grams: 1250,
      length_mm: 305,
      width_mm: 200,
      height_mm: 75,
    });
  });

  it("validates required variant fields", () => {
    const errors = validateVariantDraft({
      id: 1,
      text: "",
      price: "",
      quantity_in_stock: "",
      weight: "",
      width: "",
      height: "",
      length: "",
    });

    expect(errors).toMatchObject({
      text: "variantTextRequired",
      price: "variantPriceRequired",
      quantity_in_stock: "variantStockRequired",
      weight: "variantPackageWeightRequired",
      width: "variantPackageWidthRequired",
      height: "variantPackageHeightRequired",
      length: "variantPackageLengthRequired",
    });
  });

  it("validates product variants collection", () => {
    const validation = validateProductVariants({
      variantsName: "",
      variants: [{
        id: 1,
        text: "Black",
        price: "10",
        quantity_in_stock: "5",
        weight: "25.6",
        width: "800",
        height: "2060",
        length: "40",
      }],
    });

    expect(validation.name).toBe("variantNameIsRequired");
    expect(isProductVariantsValid(validation)).toBe(false);
  });

  it("maps seller API variants for edit with string price and stock", () => {
    const variants = mapSellerProductVariantsForEdit([
      {
        id: 3,
        name: "Color",
        text: "Red",
        price: 800,
        image: "http://127.0.0.1:8000/media/red.png",
        quantity_in_stock: 12,
        weight_grams: 1500,
        width_mm: 200,
        height_mm: 100,
        length_mm: 300,
      },
    ]);

    expect(variants[0]).toMatchObject({
      id: 3,
      text: "Red",
      price: "800",
      image: "http://127.0.0.1:8000/media/red.png",
      quantity_in_stock: 12,
      status: "server",
      package_weight_kg: "1.5",
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
          package_length_mm: "",
          package_width_mm: "",
          package_height_mm: "",
        },
        "Color"
      )
    ).toEqual({
      price: "10.00",
      name: "Color",
      text: "Black",
    });
  });

  it("omits unchanged server image urls from edit patch payload", () => {
    expect(
      mapEditVariantDraftToPatchPayload(
        {
          id: 1,
          price: "10.00",
          text: "Black",
          image: "http://127.0.0.1:8000/media/variants/door.png",
        },
        "Color"
      )
    ).toEqual({
      price: "10.00",
      name: "Color",
      text: "Black",
    });
  });

  it("sends base64 image updates in edit patch payload", () => {
    expect(
      mapEditVariantDraftToPatchPayload(
        {
          id: 1,
          price: "10.00",
          image: "data:image/png;base64,updated",
        },
        "Color"
      )
    ).toEqual({
      price: "10.00",
      name: "Color",
      text: undefined,
      image: "data:image/png;base64,updated",
    });
  });

  it("requires all package dimensions for variant validation", () => {
    expect(
      areOptionalPackageDimensionsValid({
        package_weight_kg: "",
        package_length_mm: "",
        package_width_mm: null,
        package_height_mm: undefined,
      })
    ).toBe(false);
  });

  it("rejects filled invalid edit package dimensions", () => {
    expect(areOptionalPackageDimensionsValid({
      package_weight_kg: "2",
      package_width_mm: "200",
      package_height_mm: "100",
      package_length_mm: "300",
    })).toBe(true);
    expect(areOptionalPackageDimensionsValid({ package_weight_kg: "0" })).toBe(false);
    expect(areOptionalPackageDimensionsValid({ package_width_mm: "abc" })).toBe(false);
    expect(areOptionalPackageDimensionsValid({ package_height_mm: "-1" })).toBe(false);
    expect(areOptionalPackageDimensionsValid({ package_length_mm: "12.5" })).toBe(false);
  });

  it("blocks invalid license formats before upload", () => {
    const formatError = "License file must be JPG, JPEG, PNG, WebP, or PDF.";
    expect(validateLicenseFile(new File(["x"], "license.doc", { type: "application/msword" }))).toBe(
      formatError
    );
    expect(validateLicenseFile(new File(["x"], "license.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }))).toBe(formatError);
    expect(validateLicenseFile(new File(["x"], "license.pdf", { type: "application/pdf" }))).toBeNull();
    expect(validateLicenseFile(new File(["x"], "license.jpg", { type: "image/jpeg" }))).toBeNull();
    expect(validateLicenseFile(new File(["x"], "license.jpeg", { type: "image/jpeg" }))).toBeNull();
    expect(validateLicenseFile(new File(["x"], "license.png", { type: "image/png" }))).toBeNull();
    expect(validateLicenseFile(new File(["x"], "license.webp", { type: "image/webp" }))).toBeNull();
  });

  it("rejects empty and oversized license files before upload", () => {
    expect(validateLicenseFile(new File([], "license.pdf", { type: "application/pdf" }))).toBe(
      "The selected file is empty."
    );
    const oversized = new File([new Uint8Array(LICENSE_MAX_BYTES + 1)], "license.pdf", {
      type: "application/pdf",
    });
    expect(validateLicenseFile(oversized)).toBe(
      "License file must be smaller than 13 MB."
    );
  });

  it("rejects license files with mismatched mime type", () => {
    const formatError = "License file must be JPG, JPEG, PNG, WebP, or PDF.";
    expect(validateLicenseFile(new File(["x"], "license.png", { type: "application/pdf" }))).toBe(
      formatError
    );
    expect(validateLicenseFile(new File(["x"], "license.webp", { type: "image/png" }))).toBe(
      formatError
    );
  });

  it("rejects mixed license selection when any file is invalid", () => {
    expect(validateLicenseFiles([
      new File(["x"], "license.pdf", { type: "application/pdf" }),
      new File(["x"], "photo.doc", { type: "application/msword" }),
    ])).toBe("License file must be JPG, JPEG, PNG, WebP, or PDF.");
  });

  it("allows single PDF, JPG, JPEG, PNG, or WebP license selection", () => {
    expect(validateLicenseFiles([
      new File(["x"], "license.pdf", { type: "application/pdf" }),
    ])).toBeNull();
    expect(validateLicenseFiles([
      new File(["x"], "license.jpg", { type: "image/jpeg" }),
    ])).toBeNull();
    expect(validateLicenseFiles([
      new File(["x"], "license.png", { type: "image/png" }),
    ])).toBeNull();
    expect(validateLicenseFiles([
      new File(["x"], "license.webp", { type: "image/webp" }),
    ])).toBeNull();
  });

  it("maps backend license API errors to wizard messages", () => {
    const t = (key) => key;
    expect(mapLicenseApiError("Unsupported file type. Allowed: PDF, JPG, PNG, WebP.", t)).toBe(
      "goods.errors.licenseFileFormat"
    );
    expect(mapLicenseApiError("File size exceeds the maximum allowed size (13 MB).", t)).toBe(
      "goods.errors.licenseFileSize"
    );
    expect(mapLicenseApiError("A license file already exists for this product.", t)).toBe(
      "goods.errors.licenseAlreadyExists"
    );
  });

  it("translates license upload API payload through formatSellerWizardApiError", () => {
    const t = (key) => key;
    expect(formatSellerWizardApiError(
      { file: ["Unsupported file type. Allowed: PDF, JPG, PNG, WebP."] },
      t,
      "Unknown error"
    )).toBe("goods.errors.licenseFileFormat");
    expect(formatSellerWizardApiError(
      { brand_name: ["brand_min_length"] },
      t,
      "Unknown error"
    )).toBe("goods.validation.brandMinLength");
    expect(translateSellerWizardError(
      "Unsupported file type. Allowed: PDF, JPG, PNG, WebP.",
      t
    )).toBe("goods.errors.licenseFileFormat");
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

  it("builds seller review data with additional details and VAT display", () => {
    const review = buildSellerReviewData({
      name: "Door",
      category: { id: 1, name: "Entry doors" },
      product_description: "Strong door",
      additional_details: "Seller note",
      brand_name: "Samsung",
      country_of_origin: "Czech Republic",
      warranty_months: "24",
      barcode: "1234567890123",
      item: "1234567890",
      is_age: true,
      vat_rate: "0.00",
      rating: "4.7",
      total_reviews: "13",
      variantsName: "Color",
      variantsMain: [
        {
          id: 1,
          text: "Black",
          price: "99.90",
          price_without_vat: "82.56",
          quantity_in_stock: "7",
          length: "40",
          width: "800",
          height: "2060",
          weight: "25.6",
        },
      ],
    });

    expect(review.productName).toBe("Door");
    expect(review.categoryName).toBe("Entry doors");
    expect(review.vatRate).toBe("0");
    expect(review.priceWithoutVat).toBe("82.56");
    expect(review.rating).toBe(4.7);
    expect(review.totalReviews).toBe(13);
    expect(review.additionalDetails).toMatchObject({
      additional_details: "Seller note",
      brand_name: "Samsung",
      country_of_origin: "Czech Republic",
      warranty_months: "24",
      barcode: "1234567890123",
      article: "1234567890",
      is_age_restricted: true,
    });
    expect(review.variants[0].packageDimensions).toMatchObject({
      length: "40",
      width: "800",
      height: "2060",
      weight: "25.6",
    });
    expect(review.variants[0].stock).toBe("7");
  });

  it("builds empty-safe seller review data for null product", () => {
    const review = buildSellerReviewData(null);

    expect(review).toMatchObject({
      productName: "",
      categoryName: "",
      images: [],
      variants: [],
      documents: [],
      hasMissingRequiredAttributes: false,
    });
  });

  it("maps loaded product detail by id into seller review data", () => {
    const productPayload = {
      name: "Loaded Door",
      category_name: "Public doors",
      product_description: "Loaded detail description",
      images: [{ id: 1, image_url: "/media/door.png" }],
      variants: [
        {
          id: 7,
          name: "Color",
          text: "White",
          price: "120.00",
          sku: "SKU-7",
          length_mm: 300,
          width_mm: 200,
          height_mm: 100,
          weight_grams: 1500,
        },
      ],
      license_file: { id: 5, name: "certificate.pdf", status: "server", file_url: "/media/certificate.pdf" },
      additional_details: "Loaded additional",
      country_of_origin: "Slovakia",
      warranty_months: 18,
      barcode: "1234567890123",
      article: "1234567890",
      is_age_restricted: false,
      vat_rate: "0.00",
      moderation_status: "pending",
    };
    const review = buildSellerReviewData(productPayload);

    expect(review.productName).toBe("Loaded Door");
    expect(review.categoryName).toBe("Public doors");
    expect(review.images[0].src).toBe("/media/door.png");
    expect(review.variants[0]).toMatchObject({
      axis: "Color",
      value: "White",
      price: "120.00",
      sku: "SKU-7",
      stock: REVIEW_STOCK_NOT_LOADED,
    });
    expect(review.variants[0].packageDimensions).toMatchObject({
      length: "300",
      width: "200",
      height: "100",
      weight: "1.5",
    });
    expect(review.documents[0]).toMatchObject({ name: "certificate.pdf", status: "server" });
    expect(review.documents[0].url).toBe("/media/certificate.pdf");
    expect(review.additionalDetails).toMatchObject({
      additional_details: "Loaded additional",
      country_of_origin: "Slovakia",
      warranty_months: 18,
      barcode: "1234567890123",
      article: "1234567890",
      is_age_restricted: false,
    });
    expect(review.moderation.status).toBe("pending");
  });

  it("maps public product response into product review data", () => {
    const review = buildSellerReviewData({
      name: "Public Door",
      category_name: "Entrance doors",
      rating: "4.5",
      total_reviews: "12",
      images: [{ id: 11, image_url: "/media/public-door.png" }],
      variants: [
        {
          id: 21,
          name: "Finish",
          text: "Graphite",
          price: "121.00",
          price_without_vat: "100.00",
          stock_status: "in_stock",
          available_quantity: 4,
        },
      ],
      license_file: "/media/license.pdf",
      country_of_origin: "Czech Republic",
      warranty_months: 24,
      barcode: "8594012345678",
      article: "PUB-1",
      is_age_restricted: true,
      vat_rate: "21.00",
    });

    expect(review.productName).toBe("Public Door");
    expect(review.rating).toBe(4.5);
    expect(review.totalReviews).toBe(12);
    expect(review.images[0]).toMatchObject({ src: "/media/public-door.png", alt: "Public Door" });
    expect(review.variants[0]).toMatchObject({
      axis: "Finish",
      value: "Graphite",
      price: "121.00",
      priceWithoutVat: "100.00",
      stock: 4,
      stockStatus: "in_stock",
    });
    expect(review.documents[0]).toMatchObject({
      name: "License / Certificate",
      url: "/media/license.pdf",
    });
    expect(review.additionalDetails).toMatchObject({
      country_of_origin: "Czech Republic",
      warranty_months: 24,
      barcode: "8594012345678",
      article: "PUB-1",
      is_age_restricted: true,
    });
  });

  it("maps seller product response rows and calculates price without VAT when needed", () => {
    const review = buildSellerReviewData({
      name: "Seller Door",
      category_name: "Seller category",
      vat_rate: "21.00",
      variants: [
        {
          id: 31,
          name: "Configuration",
          text: "Standard",
          price: "121.00",
          quantity_in_stock: 0,
          sku: "SKU-31",
          length_mm: 300,
          width_mm: 200,
          height_mm: 100,
          weight_grams: 1500,
        },
      ],
      product_attributes: [
        {
          id: 41,
          code: "material",
          name: "Material",
          value_text: "Steel",
          is_required: true,
        },
        {
          id: 42,
          code: "fire_rated",
          name: "Fire rated",
          value_boolean: false,
        },
      ],
      license_file: { id: 5, name: "certificate.docx", file_url: "/media/certificate.docx" },
    });

    expect(review.priceWithoutVat).toBe("100.00");
    expect(review.variants[0]).toMatchObject({
      priceWithoutVat: "100.00",
      stock: 0,
      stockStatus: "out_of_stock",
      sku: "SKU-31",
    });
    expect(review.variants[0].packageDimensions).toMatchObject({
      length: "300",
      width: "200",
      height: "100",
      weight: "1.5",
    });
    expect(review.categoryAttributes).toEqual([
      expect.objectContaining({ name: "Material", display: "Steel", isRequired: true }),
      expect.objectContaining({ name: "Fire rated", display: "No" }),
    ]);
    expect(review.documents[0]).toMatchObject({
      name: "certificate.docx",
      url: "/media/certificate.docx",
    });
  });

  it("unwraps product preview Axios response before building review data", () => {
    const productPayload = {
      name: "Response Door",
      category_name: "Response category",
      images: [{ id: 1, image_url: "/media/response.png" }],
      variants: [{ id: 1, name: "Size", text: "M", price: "88.00" }],
      license_file: { id: 10, name: "license.pdf", status: "server" },
      additional_details: "Response additional",
    };

    const directReview = buildSellerReviewData({ data: productPayload });
    const unwrappedReview = buildSellerReviewData(unwrapProductPreviewResponse({ data: productPayload }));

    expect(directReview.productName).toBe("");
    expect(unwrappedReview).toMatchObject({
      productName: "Response Door",
      categoryName: "Response category",
      description: "",
    });
    expect(unwrappedReview.images[0].src).toBe("/media/response.png");
    expect(unwrappedReview.variants[0]).toMatchObject({
      axis: "Size",
      value: "M",
      price: "88.00",
    });
    expect(unwrappedReview.documents[0]).toMatchObject({ name: "license.pdf", status: "server" });
    expect(unwrappedReview.additionalDetails.additional_details).toBe("Response additional");
    expect(unwrapProductPreviewResponse(productPayload)).toBe(productPayload);
    expect(unwrapProductPreviewResponse(null)).toBeNull();
  });

  it("returns wrapper object when response.data is null", () => {
    const wrapper = { data: null, status: 200 };
    expect(unwrapProductPreviewResponse(wrapper)).toEqual(wrapper);
    expect(unwrapProductPreviewResponse(null)).toBeNull();
  });

  it("prefers variantsServ over variantsMain when both present", () => {
    const review = buildSellerReviewData({
      variantsServ: [{ id: 1, text: "Serv variant", price: "10.00" }],
      variantsMain: [{ id: 2, text: "Main variant", price: "20.00" }],
    });
    expect(review.variants).toHaveLength(1);
    expect(review.variants[0].value).toBe("Serv variant");
  });

  it("preserves zero stock quantity instead of using stock-not-loaded fallback", () => {
    const review = buildSellerReviewData({
      variantsServ: [{ id: 1, text: "A", price: "5.00", quantity_in_stock: 0 }],
    });
    expect(review.variants[0].stock).toBe(0);
  });

  it("excludes optional typed attributes with no value from review", () => {
    const review = buildSellerReviewData({
      attributeSchema: {
        attributes: [
          { id: 1, name: "Material", data_type: "text", is_required: false },
          { id: 2, name: "Color",    data_type: "text", is_required: false },
        ],
      },
      attributeValues: { 2: "Red" },
    });
    expect(review.categoryAttributes).toHaveLength(1);
    expect(review.categoryAttributes[0].name).toBe("Color");
  });

  it("maps string license url into document link row", () => {
    const review = buildSellerReviewData({
      license_file: "https://example.com/license.pdf",
    });

    expect(review.documents).toHaveLength(1);
    expect(review.documents[0]).toMatchObject({
      name: "License / Certificate",
      url: "https://example.com/license.pdf",
    });
  });

  it("maps create-flow license base64 draft into document link row", () => {
    const review = buildSellerReviewData({
      license_file: [{
        id: 42,
        name: "certificate.pdf",
        base64: "data:application/pdf;base64,ZmFrZQ==",
      }],
    });

    expect(review.documents).toHaveLength(1);
    expect(review.documents[0]).toMatchObject({
      name: "certificate.pdf",
      url: "data:application/pdf;base64,ZmFrZQ==",
    });
  });

  it("builds seller review typed attribute display values", () => {
    const review = buildSellerReviewData({
      attributeSchema: {
        attributes: [
          { id: 1, name: "Material", data_type: "text", is_required: true },
          { id: 2, name: "Fire rated", data_type: "boolean" },
          {
            id: 3,
            name: "Opening",
            data_type: "enum",
            options: [{ id: 10, value: "left", label: "Left" }],
          },
          { id: 4, name: "Width", data_type: "number", unit: "cm" },
        ],
      },
      attributeValues: {
        1: "Steel",
        2: false,
        3: 10,
        4: "90",
      },
    });

    expect(review.categoryAttributes.map((item) => item.display)).toEqual([
      "Steel",
      "No",
      "Left",
      "90 cm",
    ]);
    expect(review.hasMissingRequiredAttributes).toBe(false);
  });

  it("marks missing required typed attributes in seller review data", () => {
    const review = buildSellerReviewData({
      attributeSchema: {
        attributes: [
          { id: 1, name: "Material", data_type: "text", is_required: true },
        ],
      },
      attributeValues: {},
    });

    expect(review.hasMissingRequiredAttributes).toBe(true);
    expect(review.categoryAttributes[0]).toMatchObject({
      name: "Material",
      missingRequired: true,
    });
  });

  it("merges schema and API category attributes for review characteristics", () => {
    const review = buildSellerReviewData({
      attributeSchema: {
        attributes: [
          {
            id: 501,
            code: "door_material",
            name: "Door material",
            data_type: "text",
            is_required: false,
          },
        ],
      },
      attributeValues: {
        501: "Cold-rolled steel, 1.5 mm",
      },
      product_attributes: [
        {
          id: 502,
          code: "opening_type",
          name: "Opening type",
          value_text: "Left-hand, inward-opening",
        },
      ],
    });

    expect(review.categoryAttributes).toEqual([
      expect.objectContaining({ name: "Door material", display: "Cold-rolled steel, 1.5 mm" }),
      expect.objectContaining({ name: "Opening type", display: "Left-hand, inward-opening" }),
    ]);
  });

  it("maps legacy product parameters and excludes physical dimension rows", () => {
    expect(mapProductParametersForReview([
      { id: 1, name: "Door material", value: "Steel" },
      { id: 2, name: "Length", value: "100" },
    ])).toEqual([
      { id: 1, name: "Door material", value: "Steel" },
    ]);
  });

  it("uses explicit stock fallback when variant stock is not loaded", () => {
    const review = buildSellerReviewData({
      variantsServ: [
        { id: 1, name: "Style", text: "Default", price: "10.00" },
      ],
    });

    expect(review.variants[0].stock).toBe(REVIEW_STOCK_NOT_LOADED);
  });

  it("maps low stock quantities to few_left when stock_status is absent", () => {
    const review = buildSellerReviewData({
      variantsMain: [
        { id: 1, text: "Default", price: "10.00", quantity_in_stock: 3 },
      ],
    });

    expect(review.variants[0].stockStatus).toBe("few_left");
  });

  it("maps variant image sources for review variant cards", () => {
    const review = buildSellerReviewData({
      variantsMain: [
        {
          id: 1,
          text: "Dark steel",
          price: "832.00",
          image_url: "/media/dark-steel.png",
        },
        {
          id: 2,
          price: "890.00",
          image: "data:image/png;base64,preview",
        },
      ],
    });

    expect(review.variants[0]).toMatchObject({
      value: "Dark steel",
      image: "/media/dark-steel.png",
    });
    expect(review.variants[1]).toMatchObject({
      value: "Image variant",
      image: "data:image/png;base64,preview",
    });
  });

  it("maps seller variant stock quantities for review", () => {
    const review = buildSellerReviewData({
      variantsServ: [
        { id: 1, text: "Red", price: "10.00", quantity_in_stock: 12 },
        { id: 2, text: "Blue", price: "12.00", quantity_in_stock: 0 },
      ],
    });

    expect(review.variants[0]).toMatchObject({
      stock: 12,
      stockStatus: "in_stock",
    });
    expect(review.variants[1]).toMatchObject({
      stock: 0,
      stockStatus: "out_of_stock",
    });
  });

  it("keeps partial success retry state with created product id and failed steps", async () => {
    postSellerProduct.mockResolvedValue({ id: 123 });
    postSellerVariants.mockResolvedValue([{ id: 501 }]);
    putSellerVariantStock.mockResolvedValue({ quantity_in_stock: 5 });
    postSellerImages.mockRejectedValue(new Error("Image upload failed"));
    const store = makeCreateStore();
    store.dispatch(setCreateCategory({ id: 10, name: "Doors" }));
    store.dispatch({
      type: fetchCreateCategoryAttributeSchema.fulfilled.type,
      payload: { attributes: [] },
    });
    store.dispatch(setCreateValues({
      name: "Door",
      brand_name: "Samsung",
      product_description: "Front door",
      images: [{ image_url: "data:image/png;base64,ok" }],
      variantsName: "Color",
      variantsMain: [validCreateVariant()],
    }));

    const result = await store.dispatch(fetchCreateProduct());

    expect(result.type).toBe(fetchCreateProduct.fulfilled.type);
    expect(store.getState().create_prev.createdProductId).toBe(123);
    expect(store.getState().create_prev.partialSuccess).toBe(true);
    expect(store.getState().create_prev.submitStepResults).toEqual(expect.arrayContaining([
      expect.objectContaining({ step: "images", status: "rejected" }),
    ]));
  });
});

const makeReviewFixture = (overrides = {}) => ({
  productName: "Door Metal - 5",
  categoryName: "Entrance Doors",
  rating: 0,
  totalReviews: 0,
  price: "832.00",
  priceWithoutVat: "687.60",
  vatRate: "21",
  variantAxisName: "Style",
  deliveryText: "Delivery: 2 days to 4 months",
  description: "High-security entrance door.",
  images: [],
  categoryAttributes: [],
  productParameters: [],
  documents: [{ id: 1, name: "certificate.pdf", url: "https://example.com/cert.pdf" }],
  variants: [
    {
      id: 1,
      axis: "Style",
      value: "Dark steel",
      price: "832.00",
      priceWithoutVat: "687.60",
      stock: 0,
      stockStatus: "out_of_stock",
    },
  ],
  additionalDetails: {
    additional_details: "Manufactured to EN 1627.",
    brand_name: "Reli Door",
    country_of_origin: "Czech Republic",
    warranty_months: "24",
    barcode: "8594012345678",
    article: "RG-DOOR-M5-DS",
    is_age_restricted: false,
  },
  moderation: {
    status: "draft",
    statusLabel: "Draft",
  },
  hasMissingRequiredAttributes: false,
  ...overrides,
});

const renderProductInfo = (review) => render(
  React.createElement(SellerReviewProductInfo, {
    review,
    activeVariantId: review.variants[0]?.id ?? null,
    onActiveVariantChange: vi.fn(),
  })
);

describe("seller review product layout regressions", () => {
  const sellerHomeEnItemLabels = {
    "goods.brand": "Brand",
    "goods.countryOfOriginLabel": "Country of origin",
    "goods.warrantyMonthsLabel": "Warranty, months",
    "goods.ageRestrictedLabel": "Age restricted",
    "goods.listingInformationTitle": "Listing Information",
    "goods.notSpecified": "Not specified",
    "goods.yes": "Yes",
    "goods.no": "No",
    "goods.reviewDescriptionTab": "Description",
    "goods.reviewReviewsTab": "Reviews",
    "goods.additionalSellerDetailsTitle": "Additional seller details",
    "goods.reviewParametersSectionTitle": "Parameters / Characteristics",
    "goods.reviewNoListingInformation": "No listing information added",
    "goods.reviewNoCharacteristics": "No category attributes or legacy parameters added",
    "goods.reviewNoPackageDimensions": "No package dimensions added",
    "goods.reviewNoDocuments": "No license or certificate added",
    "goods.reviewCertificatePrefix": "You can read the certificate",
    "goods.reviewCertificateLink": "here",
    "goods.reviewRequiredAttributeMissing": "Required value is missing",
    "goods.reviewMissingRequiredAttributes": "Required category attributes are missing.",
    "goods.reviewNoDataAdded": "No data added",
    "goods.documentsSectionTitle": "Documents",
    "item.packageDimensions": "Package dimensions",
    "item.packageHeightMm": "Package height, mm",
    "item.packageWidthMm": "Package width, mm",
    "item.packageLengthMm": "Package length, mm",
    "item.packageWeightKg": "Package weight, kg",
  };

  beforeEach(() => {
    useTranslation.mockImplementation(() => ({
      t: (key) => sellerHomeEnItemLabels[key] ?? key,
      i18n: { language: "en" },
    }));
  });

  it("renders preview banner with Preview mode text only", () => {
    render(
      React.createElement(SellerReviewProductLayout, {
        review: makeReviewFixture({
          moderation: { status: "fulfilled", statusLabel: "Fulfilled" },
        }),
      })
    );

    expect(screen.getByText(/Preview mode\./)).toBeTruthy();
    expect(screen.queryByText("FULFILLED")).toBeNull();
    expect(screen.queryByText("Seller goods")).toBeNull();
  });

  it("renders product name before category in product info", () => {
    renderProductInfo(makeReviewFixture());

    const heading = screen.getByRole("heading", { level: 1 });
    const category = screen.getByText("Entrance Doors");

    expect(heading).toHaveTextContent("Door Metal - 5");
    expect(heading.compareDocumentPosition(category) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders Excl. VAT line with VAT rate and price without VAT", () => {
    renderProductInfo(makeReviewFixture());

    const vatLine = screen.getByText("687.60 €").closest("p");
    expect(vatLine?.textContent).toMatch(/Excl\. VAT \(21%\):/);
    expect(screen.getByText("687.60 €")).toHaveAttribute("translate", "no");
  });

  it("renders disabled Add to cart without basket behavior", () => {
    renderProductInfo(makeReviewFixture({
      variants: [
        {
          id: 1,
          axis: "Style",
          value: "Dark steel",
          price: "832.00",
          priceWithoutVat: "687.60",
          stock: 12,
          stockStatus: "in_stock",
        },
      ],
    }));

    const addToCartButton = screen.getByRole("button", { name: "add_basket" });
    expect(addToCartButton).toBeDisabled();
    expect(addToCartButton).toHaveAttribute("aria-disabled", "true");
  });

  it("renders out of stock label on preview add to cart button", () => {
    renderProductInfo(makeReviewFixture());

    expect(screen.getByRole("button", { name: "out_of_stock" })).toBeDisabled();
  });

  it("renders variant image cards when variant images are available", () => {
    renderProductInfo(makeReviewFixture({
      variants: [
        {
          id: 1,
          axis: "Style",
          value: "Dark steel",
          price: "832.00",
          image: "/media/dark-steel.png",
          stock: 5,
          stockStatus: "few_left",
        },
      ],
    }));

    expect(screen.getByRole("img", { name: "Dark steel" })).toBeTruthy();
  });

  it("renders image-only variant cards without placeholder label", () => {
    renderProductInfo(makeReviewFixture({
      variantAxisName: "Color",
      variants: [
        {
          id: 1,
          axis: "Color",
          value: "Image variant",
          price: "832.00",
          image: "/media/dark-steel.png",
          stock: 5,
          stockStatus: "few_left",
        },
      ],
    }));

    expect(screen.getByRole("img", { name: "Color" })).toBeTruthy();
    expect(screen.queryByText("Image variant")).toBeNull();
    expect(screen.queryByText("Image")).toBeNull();
    expect(screen.getByText(/^Color:$/)).toBeTruthy();
    expect(screen.getAllByText("832.00 €").length).toBeGreaterThan(0);
  });

  it("renders stock status on variant cards only", () => {
    renderProductInfo(makeReviewFixture({
      variants: [
        {
          id: 1,
          axis: "Style",
          value: "Red",
          price: "832.00",
          stock: 12,
          stockStatus: "in_stock",
        },
        {
          id: 2,
          axis: "Style",
          value: "Blue",
          price: "900.00",
          stock: 2,
          stockStatus: "few_left",
        },
      ],
    }));

    expect(screen.getAllByText("IN_STOCK").length).toBeGreaterThan(0);
    expect(screen.getAllByText("FEW_LEFT").length).toBeGreaterThan(0);
    expect(screen.queryByText("Stock: 12")).toBeNull();
    expect(screen.queryByTestId("stock-badge")).toBeNull();
  });

  it("renders listing information rows in DOM order without hidden seller fields", () => {
    render(
      React.createElement(SellerReviewDetailsSections, {
        review: makeReviewFixture(),
        activeVariant: makeReviewFixture().variants[0],
      })
    );

    expect(screen.getByText(sellerHomeEnItemLabels[LISTING_INFORMATION_TITLE_KEY])).toBeTruthy();

    const labels = screen.getAllByRole("term").map((node) => node.textContent);
    const listingLabels = LISTING_INFO_ROWS.map((row) => (
      row.labelKey ? sellerHomeEnItemLabels[row.labelKey] ?? row.labelKey : row.label
    ));

    expect(labels.filter((label) => listingLabels.includes(label))).toEqual([
      "Brand",
      "Country of origin",
      "Warranty, months",
    ]);
    expect(screen.queryByText("EAN/UPC barcode")).toBeNull();
    expect(screen.queryByText("Seller article")).toBeNull();
    expect(screen.queryByText("Age restricted")).toBeNull();
    expect(screen.queryByText("Moderation status")).toBeNull();
  });

  it("hides brand listing row when brand value is empty", () => {
    render(
      React.createElement(SellerReviewDetailsSections, {
        review: makeReviewFixture({
          additionalDetails: {
            ...makeReviewFixture().additionalDetails,
            brand_name: "",
          },
        }),
        activeVariant: makeReviewFixture().variants[0],
      })
    );

    expect(screen.queryByText("Brand")).toBeNull();
    expect(screen.getByText("Country of origin")).toBeTruthy();
  });

  it("renders age restricted only when product is age restricted", () => {
    render(
      React.createElement(SellerReviewDetailsSections, {
        review: makeReviewFixture({
          additionalDetails: {
            ...makeReviewFixture().additionalDetails,
            is_age_restricted: true,
          },
        }),
        activeVariant: makeReviewFixture().variants[0],
      })
    );

    expect(screen.getByText("Age restricted")).toBeTruthy();
    expect(screen.getByText("Yes")).toBeTruthy();
  });

  it("renders characteristics rows for category attributes and legacy parameters", () => {
    render(
      React.createElement(SellerReviewDetailsSections, {
        review: makeReviewFixture({
          categoryAttributes: [
            { id: 1, name: "Door material", display: "Cold-rolled steel, 1.5 mm", isRequired: false },
          ],
          productParameters: [
            { id: 2, name: "Opening type", value: "Left-hand, inward-opening" },
          ],
        }),
        activeVariant: makeReviewFixture().variants[0],
      })
    );

    expect(screen.getByText("Door material")).toBeTruthy();
    expect(screen.getByText("Cold-rolled steel, 1.5 mm")).toBeTruthy();
    expect(screen.getByText("Opening type")).toBeTruthy();
    expect(screen.getByText("Left-hand, inward-opening")).toBeTruthy();
  });

  it("renders package dimensions for the active variant only", () => {
    const variantOneDimensions = { height: "2000", width: "900", length: "45", weight: "25.6" };
    const variantTwoDimensions = { height: "2100", width: "950", length: "48", weight: "26.5" };

    const { rerender } = render(
      React.createElement(SellerReviewDetailsSections, {
        review: makeReviewFixture({
          variants: [
            {
              id: 1,
              value: "Dark steel",
              packageDimensions: variantOneDimensions,
            },
            {
              id: 2,
              value: "Matte black",
              packageDimensions: variantTwoDimensions,
            },
          ],
        }),
        activeVariant: {
          id: 1,
          value: "Dark steel",
          packageDimensions: variantOneDimensions,
        },
      })
    );

    expect(screen.getByText("Package height, mm")).toBeTruthy();
    expect(screen.getByText("Package width, mm")).toBeTruthy();
    expect(screen.getByText("Package length, mm")).toBeTruthy();
    expect(screen.getByText("Package weight, kg")).toBeTruthy();
    expect(screen.getByText("45")).toBeTruthy();
    expect(screen.queryByText("48")).toBeNull();

    rerender(
      React.createElement(SellerReviewDetailsSections, {
        review: makeReviewFixture({
          variants: [
            {
              id: 1,
              value: "Dark steel",
              packageDimensions: variantOneDimensions,
            },
            {
              id: 2,
              value: "Matte black",
              packageDimensions: variantTwoDimensions,
            },
          ],
        }),
        activeVariant: {
          id: 2,
          value: "Matte black",
          packageDimensions: variantTwoDimensions,
        },
      })
    );

    expect(screen.getByText("48")).toBeTruthy();
    expect(screen.queryByText("45")).toBeNull();
  });

  it("renders stock zero as 0 instead of Not specified", () => {
    renderProductInfo({
      productName: "Door",
      categoryName: "Doors",
      rating: 0,
      totalReviews: 0,
      price: "121.00",
      priceWithoutVat: "100.00",
      vatRate: "21",
      variantAxisName: "Style",
      deliveryText: "Preview delivery",
      variants: [
        {
          id: 1,
          value: "Default",
          price: "121.00",
          priceWithoutVat: "100.00",
          stock: 0,
          stockStatus: "out_of_stock",
          sku: "SKU-1",
        },
      ],
    });

    expect(screen.queryByText("Stock: Not specified")).toBeNull();
    expect(screen.getAllByText("OUT_OF_STOCK").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("stock-badge")).toBeNull();
    expect(screen.getByText("SKU-1")).toHaveAttribute("translate", "no");
    expect(screen.getByText(/SKU:/)).toBeTruthy();
  });

  it("disables submit action while loading", () => {
    render(
      React.createElement(SellerReviewActions, {
        backLabel: "Back",
        submitLabel: "Submit",
        isLoading: true,
        onBack: vi.fn(),
        onSubmit: vi.fn(),
      })
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[1]).toBeDisabled();
  });
});
