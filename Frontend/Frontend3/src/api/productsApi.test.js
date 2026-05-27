import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();

vi.mock("./index.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    mainInstance: {
      get: (...args) => mockGet(...args),
    },
    getApi: vi.fn(),
  };
});

import {
  getSearchProducts,
  getProductsBySellerId,
  getProductsByCategory,
  getProductById,
  getProducts,
} from "./productsApi.js";
import { getApi } from "./index.js";

describe("productsApi — getSearchProducts", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue({ data: { results: [] } });
  });

  it("calls search endpoint with encoded query", async () => {
    await getSearchProducts("foo bar");
    expect(mockGet).toHaveBeenCalledWith("/products/search/?q=foo%20bar");
  });

  it("handles empty query", async () => {
    await getSearchProducts("");
    expect(mockGet).toHaveBeenCalledWith("/products/search/?q=");
  });

  it("returns the full axios response", async () => {
    const mockResponse = { data: { results: [{ id: 1, name: "Test" }] } };
    mockGet.mockResolvedValue(mockResponse);
    const result = await getSearchProducts("test");
    expect(result).toBe(mockResponse);
  });

  it("propagates errors from the API", async () => {
    mockGet.mockRejectedValue(new Error("Network Error"));
    await expect(getSearchProducts("fail")).rejects.toThrow("Network Error");
  });
});

describe("productsApi — getProductsBySellerId", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("calls sellers/:id/products/ endpoint", async () => {
    const mockResponse = { data: { results: [{ id: 10 }], count: 1 } };
    mockGet.mockResolvedValue(mockResponse);

    await getProductsBySellerId(42);

    expect(mockGet).toHaveBeenCalledWith("sellers/42/products/");
  });

  it("returns the API response (not undefined)", async () => {
    const mockResponse = { data: { results: [{ id: 10 }], count: 1 } };
    mockGet.mockResolvedValue(mockResponse);

    const result = await getProductsBySellerId(42);

    expect(result).toBe(mockResponse);
    expect(result).not.toBeUndefined();
  });

  it("propagates errors from the API", async () => {
    mockGet.mockRejectedValue(new Error("Seller not found"));
    await expect(getProductsBySellerId(99)).rejects.toThrow("Seller not found");
  });
});

describe("productsApi — getProductsByCategory", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("calls relative /products/categories/:category path (not hardcoded URL)", async () => {
    const mockResponse = { data: { results: [] } };
    mockGet.mockResolvedValue(mockResponse);

    await getProductsByCategory("electronics");

    const calledWith = mockGet.mock.calls[0][0];
    // Must be relative — no http:// or domain
    expect(calledWith).not.toMatch(/^https?:\/\//);
    expect(calledWith).toBe("/products/categories/electronics");
  });

  it("returns the API response", async () => {
    const mockResponse = { data: { results: [{ id: 5 }] } };
    mockGet.mockResolvedValue(mockResponse);

    const result = await getProductsByCategory("shoes");

    expect(result).toBe(mockResponse);
  });

  it("propagates errors from the API", async () => {
    mockGet.mockRejectedValue(new Error("Category not found"));
    await expect(getProductsByCategory("unknown")).rejects.toThrow(
      "Category not found"
    );
  });
});

describe("productsApi — getProductById", () => {
  beforeEach(() => {
    getApi.mockReset?.();
  });

  it("calls getApi with correct path including id", async () => {
    const mockResponse = { data: { id: 7, name: "Widget" } };
    getApi.mockResolvedValue(mockResponse);

    const result = await getProductById(7);

    expect(getApi).toHaveBeenCalledWith("products/7/?id=7");
    expect(result).toBe(mockResponse);
  });

  it("propagates errors from the API", async () => {
    getApi.mockRejectedValue(new Error("Product not found"));
    await expect(getProductById(999)).rejects.toThrow("Product not found");
  });
});

describe("productsApi — getProducts", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue({ data: { results: [], count: 0 } });
  });

  it("calls /products/ with mapped query params", async () => {
    const params = {
      category: "electronics",
      max: 500,
      min: 10,
      ordering: "price",
      page: 2,
    };
    await getProducts(params);

    expect(mockGet).toHaveBeenCalledWith("/products/", {
      params: {
        categories: "electronics",
        max_price: 500,
        min_price: 10,
        ordering: "price",
        page: 2,
      },
    });
  });

  it("returns response.data", async () => {
    const payload = { results: [{ id: 1 }], count: 1 };
    mockGet.mockResolvedValue({ data: payload });

    const result = await getProducts({ category: 1, max: 100, min: 0, ordering: "rating", page: 1 });

    expect(result).toEqual(payload);
  });

  it("propagates errors from the API", async () => {
    mockGet.mockRejectedValue(new Error("Server error"));
    await expect(
      getProducts({ category: 1, max: 100, min: 0, ordering: "price", page: 1 })
    ).rejects.toThrow("Server error");
  });
});
