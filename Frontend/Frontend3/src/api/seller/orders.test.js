// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock("../index.js", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
  },
}));

import {
  getOrders,
  getOrderDetails,
  postOrderConfirm,
  postOrderShipped,
  postCencelOrder,
  postDownloadLabels,
  postExportLabels,
  getLabels,
  getExportLabels,
  getShipmentLabel,
} from "./orders.js";

// ── getOrders ──────────────────────────────────────────────────────────────────

describe("seller orders — getOrders", () => {
  beforeEach(() => mockGet.mockReset());

  it("calls sellers/orders/ endpoint", async () => {
    mockGet.mockResolvedValue({ data: [] });
    await getOrders();
    expect(mockGet).toHaveBeenCalledWith("sellers/orders/", { params: {} });
  });

  it("forwards params to the API", async () => {
    mockGet.mockResolvedValue({ data: [] });
    await getOrders({ status: "pending", page: 2 });
    expect(mockGet).toHaveBeenCalledWith("sellers/orders/", {
      params: { status: "pending", page: 2 },
    });
  });

  it("returns the axios response", async () => {
    const mockResponse = { data: [{ id: 1 }] };
    mockGet.mockResolvedValue(mockResponse);
    const result = await getOrders();
    expect(result).toBe(mockResponse);
  });

  it("propagates errors", async () => {
    mockGet.mockImplementationOnce(() => { throw new Error("Network Error"); });
    await expect(getOrders()).rejects.toThrow("Network Error");
  });
});

// ── getOrderDetails ────────────────────────────────────────────────────────────

describe("seller orders — getOrderDetails", () => {
  beforeEach(() => mockGet.mockReset());

  it("calls sellers/orders/:id/ endpoint", async () => {
    mockGet.mockResolvedValue({ data: {} });
    await getOrderDetails(99);
    expect(mockGet).toHaveBeenCalledWith("sellers/orders/99/");
  });

  it("returns the axios response", async () => {
    const mockResponse = { data: { id: 99, status: "confirmed" } };
    mockGet.mockResolvedValue(mockResponse);
    const result = await getOrderDetails(99);
    expect(result).toBe(mockResponse);
  });

  it("propagates errors", async () => {
    mockGet.mockImplementationOnce(() => { throw new Error("Not Found"); });
    await expect(getOrderDetails(0)).rejects.toThrow("Not Found");
  });
});

// ── postOrderConfirm ───────────────────────────────────────────────────────────

describe("seller orders — postOrderConfirm", () => {
  beforeEach(() => mockPost.mockReset());

  it("calls sellers/orders/:id/confirm/", async () => {
    mockPost.mockResolvedValue({ data: {} });
    await postOrderConfirm(5);
    expect(mockPost).toHaveBeenCalledWith("sellers/orders/5/confirm/");
  });

  it("returns the axios response", async () => {
    const mockResponse = { data: { status: "confirmed" } };
    mockPost.mockResolvedValue(mockResponse);
    const result = await postOrderConfirm(5);
    expect(result).toBe(mockResponse);
  });

  it("propagates errors", async () => {
    mockPost.mockImplementationOnce(() => { throw new Error("Forbidden"); });
    await expect(postOrderConfirm(5)).rejects.toThrow("Forbidden");
  });
});

// ── postOrderShipped ───────────────────────────────────────────────────────────

describe("seller orders — postOrderShipped", () => {
  beforeEach(() => mockPost.mockReset());

  it("calls sellers/orders/:id/mark-shipped/", async () => {
    mockPost.mockResolvedValue({ data: {} });
    await postOrderShipped(7);
    expect(mockPost).toHaveBeenCalledWith("sellers/orders/7/mark-shipped/");
  });

  it("propagates errors", async () => {
    mockPost.mockImplementationOnce(() => { throw new Error("Server Error"); });
    await expect(postOrderShipped(7)).rejects.toThrow("Server Error");
  });
});

// ── postCencelOrder ────────────────────────────────────────────────────────────

describe("seller orders — postCencelOrder", () => {
  beforeEach(() => mockPost.mockReset());

  it("calls sellers/orders/:id/cancel/", async () => {
    mockPost.mockResolvedValue({ data: {} });
    await postCencelOrder(3);
    expect(mockPost).toHaveBeenCalledWith("sellers/orders/3/cancel/");
  });

  it("propagates errors", async () => {
    mockPost.mockImplementationOnce(() => { throw new Error("Not Found"); });
    await expect(postCencelOrder(3)).rejects.toThrow("Not Found");
  });
});

// ── postDownloadLabels ─────────────────────────────────────────────────────────

describe("seller orders — postDownloadLabels", () => {
  beforeEach(() => mockPost.mockReset());

  it("calls sellers/orders/labels/ with order_ids array", async () => {
    mockPost.mockResolvedValue({ data: new Blob() });
    await postDownloadLabels([1, 2, 3]);
    expect(mockPost).toHaveBeenCalledWith(
      "sellers/orders/labels/",
      { order_ids: [1, 2, 3] },
      { responseType: "blob" }
    );
  });

  it("propagates errors", async () => {
    mockPost.mockImplementationOnce(() => { throw new Error("Server Error"); });
    await expect(postDownloadLabels([1])).rejects.toThrow("Server Error");
  });
});

// ── postExportLabels ───────────────────────────────────────────────────────────

describe("seller orders — postExportLabels", () => {
  beforeEach(() => mockPost.mockReset());

  it("calls sellers/orders/export/ with order_ids array and blob response", async () => {
    mockPost.mockResolvedValue({ data: new Blob() });
    await postExportLabels([10, 20]);
    expect(mockPost).toHaveBeenCalledWith(
      "sellers/orders/export/",
      { order_ids: [10, 20] },
      { responseType: "blob" }
    );
  });
});

// ── getLabels ──────────────────────────────────────────────────────────────────

describe("seller orders — getLabels", () => {
  beforeEach(() => mockGet.mockReset());

  it("calls sellers/orders/:id/labels/ with blob responseType", async () => {
    mockGet.mockResolvedValue({ data: new Blob() });
    await getLabels(11);
    expect(mockGet).toHaveBeenCalledWith("sellers/orders/11/labels/", {
      responseType: "blob",
    });
  });

  it("propagates errors", async () => {
    mockGet.mockImplementationOnce(() => { throw new Error("Forbidden"); });
    await expect(getLabels(11)).rejects.toThrow("Forbidden");
  });
});

// ── getShipmentLabel ───────────────────────────────────────────────────────────

describe("seller orders — getShipmentLabel", () => {
  beforeEach(() => mockGet.mockReset());

  it("calls sellers/orders/shipments/:id/label/ with blob responseType", async () => {
    mockGet.mockResolvedValue({ data: new Blob() });
    await getShipmentLabel(55);
    expect(mockGet).toHaveBeenCalledWith("sellers/orders/shipments/55/label/", {
      responseType: "blob",
    });
  });
});
