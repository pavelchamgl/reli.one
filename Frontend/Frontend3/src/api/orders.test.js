import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();

vi.mock("./index.js", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
  },
}));

import { getDetalOrders, getOrdersCurrent, getOrders } from "./orders.js";

describe("orders api — endpoints", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue({ data: {} });
  });

  it("getDetalOrders requests path with dynamic id", async () => {
    await getDetalOrders(42);
    expect(mockGet).toHaveBeenCalledWith("/orders/42/");
  });

  it("getOrdersCurrent uses not_closed query without stray whitespace", async () => {
    await getOrdersCurrent();
    expect(mockGet).toHaveBeenCalledWith("/orders/?status=not_closed");
  });

  it("getOrders requests closed filter", async () => {
    await getOrders();
    expect(mockGet).toHaveBeenCalledWith("/orders/?status=closed");
  });
});

describe("orders api — return values", () => {
  beforeEach(() => mockGet.mockReset());

  it("getOrders returns the axios response", async () => {
    const mockResponse = { data: [{ id: 1, status: "closed" }] };
    mockGet.mockResolvedValue(mockResponse);
    const result = await getOrders();
    expect(result).toBe(mockResponse);
  });

  it("getOrdersCurrent returns the axios response", async () => {
    const mockResponse = { data: [{ id: 2, status: "not_closed" }] };
    mockGet.mockResolvedValue(mockResponse);
    const result = await getOrdersCurrent();
    expect(result).toBe(mockResponse);
  });

  it("getDetalOrders returns the axios response", async () => {
    const mockResponse = { data: { id: 7, order_number: "ORD-007" } };
    mockGet.mockResolvedValue(mockResponse);
    const result = await getDetalOrders(7);
    expect(result).toBe(mockResponse);
  });
});

// Vitest 4.x with mockRejectedValue() causes unhandled-rejection noise (see FE-003 notes).
// Use synchronous throw via mockImplementationOnce — the async function wraps it into a
// rejected promise which is then properly caught by .rejects.toThrow().
describe("orders api — error propagation", () => {
  beforeEach(() => mockGet.mockReset());

  it("getOrders propagates API errors", async () => {
    mockGet.mockImplementationOnce(() => { throw new Error("Network Error"); });
    await expect(getOrders()).rejects.toThrow("Network Error");
  });

  it("getOrdersCurrent propagates API errors", async () => {
    mockGet.mockImplementationOnce(() => { throw new Error("Unauthorized"); });
    await expect(getOrdersCurrent()).rejects.toThrow("Unauthorized");
  });

  it("getDetalOrders propagates API errors", async () => {
    mockGet.mockImplementationOnce(() => { throw new Error("Not Found"); });
    await expect(getDetalOrders(404)).rejects.toThrow("Not Found");
  });
});
