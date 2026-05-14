import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();

vi.mock("./index.js", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
  },
}));

import { getDetalOrders, getOrdersCurrent, getOrders } from "./orders.js";

describe("orders api", () => {
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
