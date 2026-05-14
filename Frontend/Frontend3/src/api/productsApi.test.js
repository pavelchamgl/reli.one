import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();

vi.mock("./index.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    mainInstance: {
      get: (...args) => mockGet(...args),
    },
  };
});

import { getSearchProducts } from "./productsApi.js";

describe("productsApi", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue({ data: { results: [] } });
  });

  it("getSearchProducts calls search endpoint with encoded query", async () => {
    await getSearchProducts("foo bar");
    expect(mockGet).toHaveBeenCalledWith("/products/search/?q=foo%20bar");
  });

  it("getSearchProducts handles empty query", async () => {
    await getSearchProducts("");
    expect(mockGet).toHaveBeenCalledWith("/products/search/?q=");
  });
});
