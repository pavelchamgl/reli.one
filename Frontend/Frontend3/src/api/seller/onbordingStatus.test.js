import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();

vi.mock("../index.js", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
  },
}));

import { getOnbordStatus } from "./onbordingStatus.js";

describe("seller onboarding status api", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue({ data: {} });
  });

  it("requests sellers onboarding state endpoint", async () => {
    await getOnbordStatus();
    expect(mockGet).toHaveBeenCalledWith("/sellers/onboarding/state/");
  });
});
