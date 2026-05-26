import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDispatch = vi.fn();
const mockErrToast = vi.fn();

vi.mock("../ui/Toastify", () => ({
  ErrToast: (...args) => mockErrToast(...args),
}));

vi.mock("../redux/storeInjector", () => ({
  getInjectedStore: () => ({ dispatch: mockDispatch }),
}));

vi.mock("../redux/authSlice", () => ({
  setToken: (token) => ({ type: "auth/setToken", payload: token }),
  clearToken: () => ({ type: "auth/clearToken" }),
}));

let responseSuccessHandler;
let responseErrorHandler;

const mockAxiosPost = vi.fn();
const mockAxiosRetry = vi.fn();

const createMockInstance = () => ({
  interceptors: {
    request: {
      use: vi.fn(),
    },
    response: {
      use: vi.fn((onFulfilled, onRejected) => {
        responseSuccessHandler = onFulfilled;
        responseErrorHandler = onRejected;
      }),
    },
  },
});

vi.mock("axios", () => {
  const create = vi.fn(() => createMockInstance());
  const isAxiosError = (err) => Boolean(err?.isAxiosError);

  const axiosFn = vi.fn((config) => mockAxiosRetry(config));
  axiosFn.create = create;
  axiosFn.post = mockAxiosPost;
  axiosFn.isAxiosError = isAxiosError;

  return { default: axiosFn };
});

let resetNetworkToastShown;

const makeNetworkError = (url = "/orders/") => ({
  isAxiosError: true,
  message: "Network Error",
  config: { url },
});

const make401Error = (url = "/orders/") => ({
  isAxiosError: true,
  response: { status: 401 },
  config: { url, headers: {} },
});

describe("api/index interceptors", () => {
  beforeEach(async () => {
    vi.resetModules();
    mockErrToast.mockClear();
    mockDispatch.mockClear();
    mockAxiosPost.mockReset();
    mockAxiosRetry.mockReset();
    localStorage.clear();

    const mod = await import("./index.js");
    resetNetworkToastShown = mod.resetNetworkToastShown;
    resetNetworkToastShown();
  });

  it("shows network ErrToast once until a successful response resets the flag", async () => {
    await responseErrorHandler(makeNetworkError()).catch(() => {});
    await responseErrorHandler(makeNetworkError()).catch(() => {});

    expect(mockErrToast).toHaveBeenCalledTimes(1);
    expect(mockErrToast).toHaveBeenCalledWith(
      "Network error. Check your internet connection"
    );

    responseSuccessHandler({ data: "ok" });

    await responseErrorHandler(makeNetworkError()).catch(() => {});
    expect(mockErrToast).toHaveBeenCalledTimes(2);
  });

  it("does not show network toast for token refresh URL failures", async () => {
    await responseErrorHandler(
      makeNetworkError("https://reli.one/api/accounts/token/refresh/")
    ).catch(() => {});

    expect(mockErrToast).not.toHaveBeenCalled();
  });

  it("retries original request after successful 401 refresh", async () => {
    localStorage.setItem(
      "token",
      JSON.stringify({ access: "old-access", refresh: "old-refresh" })
    );

    mockAxiosPost.mockResolvedValue({ data: { access: "new-access" } });
    mockAxiosRetry.mockResolvedValue({ data: "retried" });

    const result = await responseErrorHandler(make401Error());

    expect(mockAxiosPost).toHaveBeenCalledWith(
      expect.stringContaining("/accounts/token/refresh/"),
      { refresh: "old-refresh" }
    );
    expect(mockAxiosRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { Authorization: "Bearer new-access" },
      })
    );
    expect(JSON.parse(localStorage.getItem("token"))).toEqual({
      access: "new-access",
      refresh: "old-refresh",
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "auth/setToken",
      payload: { access: "new-access", refresh: "old-refresh" },
    });
    expect(result).toEqual({ data: "retried" });
  });

  it("shows session ErrToast and clears token when refresh fails", async () => {
    localStorage.setItem(
      "token",
      JSON.stringify({ access: "old-access", refresh: "old-refresh" })
    );

    mockAxiosPost.mockImplementationOnce(() => {
      throw new Error("refresh failed");
    });

    await expect(responseErrorHandler(make401Error())).rejects.toThrow(
      "refresh failed"
    );

    expect(mockErrToast).toHaveBeenCalledWith(
      "Сессия истекла. Пожалуйста, войдите заново"
    );
    expect(localStorage.getItem("token")).toBeNull();
    expect(mockDispatch).toHaveBeenCalledWith({ type: "auth/clearToken" });
  });
});
