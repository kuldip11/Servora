import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "../create-client";
import type { TokenStorageAdapter } from "../types";

const mocks = vi.hoisted(() => ({
  instance: null as any,
  post: vi.fn(),
}));

vi.mock("axios", async () => {
  const actual = await vi.importActual<typeof import("axios")>("axios");
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => mocks.instance),
      post: mocks.post,
    },
  };
});

type Interceptor<T> = {
  use: (fulfilled: (value: T) => any, rejected?: (error: any) => any) => void;
};

function makeClientHarness() {
  const request: Interceptor<any> = { use: vi.fn() };
  const response: Interceptor<any> = { use: vi.fn() };
  const api = vi.fn();
  mocks.instance = Object.assign(api, {
    interceptors: { request, response },
    post: mocks.post,
  });
  return { request, response, api };
}

function storage(
  overrides: Partial<TokenStorageAdapter> = {},
): TokenStorageAdapter {
  return {
    getAccessToken: () => null,
    setAccessToken: vi.fn(),
    clear: vi.fn(),
    ...overrides,
  };
}

function installedInterceptors(harness: ReturnType<typeof makeClientHarness>) {
  const requestHandler = (harness.request.use as any).mock.calls[0][0];
  const responseRejected = (harness.response.use as any).mock.calls[0][1];
  return { requestHandler, responseRejected };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.post.mockReset();
});

describe("createApiClient request interceptor", () => {
  it("creates the client with JSON headers and injects access/context headers", async () => {
    const harness = makeClientHarness();
    const s = storage({
      getAccessToken: () => "access",
      getTenantId: () => "tenant",
      getBranchId: () => "branch",
    });
    createApiClient({
      baseURL: "https://api.example.com",
      timeout: 5000,
      storage: s,
      onRefreshFailure: vi.fn(),
    });

    expect(axios.create).toHaveBeenCalledTimes(2);
    expect(axios.create).toHaveBeenNthCalledWith(1, {
      baseURL: "https://api.example.com",
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
      withCredentials: true,
    });
    expect(axios.create).toHaveBeenNthCalledWith(2, {
      baseURL: "https://api.example.com",
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
      withCredentials: true,
    });

    const config = { headers: {} as Record<string, string> };
    const result = installedInterceptors(harness).requestHandler(config);
    expect(result.headers).toEqual({
      Authorization: "Bearer access",
      "X-Tenant-ID": "tenant",
      "X-Branch-ID": "branch",
    });
  });

  it("removes stale tenant and branch headers when no context is selected", () => {
    const harness = makeClientHarness();
    const s = storage({ getAccessToken: () => null });
    createApiClient({
      baseURL: "/api",
      timeout: 1000,
      storage: s,
      onRefreshFailure: vi.fn(),
    });
    const config = {
      headers: {
        "X-Tenant-ID": "old-tenant",
        "X-Branch-ID": "old-branch",
        Authorization: "old",
      } as Record<string, string>,
    };
    const result = installedInterceptors(harness).requestHandler(config);
    expect(result.headers).toEqual({ Authorization: "old" });
  });
});

describe("createApiClient response interceptor", () => {
  it("rejects non-401 errors without attempting refresh", async () => {
    const harness = makeClientHarness();
    const failure = vi.fn();
    createApiClient({
      baseURL: "/api",
      timeout: 1000,
      storage: storage(),
      onRefreshFailure: failure,
    });
    const error = { response: { status: 500 }, config: { url: "/orders" } };
    await expect(
      installedInterceptors(harness).responseRejected(error),
    ).rejects.toBe(error);
    expect(mocks.post).not.toHaveBeenCalled();
    expect(failure).not.toHaveBeenCalled();
  });

  it("rejects a 401 for the refresh endpoint and an already retried request", async () => {
    const harness = makeClientHarness();
    const failure = vi.fn();
    createApiClient({
      baseURL: "/api",
      timeout: 1000,
      storage: storage(),
      onRefreshFailure: failure,
    });
    const handler = installedInterceptors(harness).responseRejected;
    await expect(
      handler({
        response: { status: 401 },
        config: { url: "/api/auth/refresh" },
      }),
    ).rejects.toBeTruthy();
    await expect(
      handler({
        response: { status: 401 },
        config: { url: "/orders", _retry: true },
      }),
    ).rejects.toBeTruthy();
    expect(mocks.post).not.toHaveBeenCalled();
  });


  it("refreshes tokens, updates storage, retries the request, and returns the retry result", async () => {
    const harness = makeClientHarness();
    const setAccessToken = vi.fn();
    const s = storage({ setAccessToken });
    const failure = vi.fn();
    const retried = { data: { ok: true } };
    harness.api.mockResolvedValue(retried);
    mocks.post.mockResolvedValue({
      data: {
        data: { accessToken: "new-access" },
      },
    });
    createApiClient({
      baseURL: "/api",
      timeout: 1000,
      storage: s,
      onRefreshFailure: failure,
    });

    const original = { url: "/orders", headers: {} as Record<string, string> };
    const result = await installedInterceptors(harness).responseRejected({
      response: { status: 401 },
      config: original,
    });
    expect(mocks.post).toHaveBeenCalledWith("/auth/refresh");
    expect(setAccessToken).toHaveBeenCalledWith("new-access");
    expect(original.headers.Authorization).toBe("Bearer new-access");
    expect(harness.api).toHaveBeenCalledWith(original);
    expect(result).toBe(retried);
    expect(failure).not.toHaveBeenCalled();
  });

  it("uses the configured absolute API origin for the isolated refresh client", async () => {
    const harness = makeClientHarness();
    const s = storage();
    mocks.post.mockResolvedValue({
      data: {
        data: { accessToken: "new-access" },
      },
    });
    harness.api.mockResolvedValue({ data: { ok: true } });

    createApiClient({
      baseURL: "https://api.example.com/api",
      timeout: 4321,
      storage: s,
      onRefreshFailure: vi.fn(),
    });

    await installedInterceptors(harness).responseRejected({
      response: { status: 401 },
      config: { url: "/orders", headers: {} },
    });

    expect(axios.create).toHaveBeenNthCalledWith(2, {
      baseURL: "https://api.example.com/api",
      headers: { "Content-Type": "application/json" },
      timeout: 4321,
      withCredentials: true,
    });
    expect(mocks.post).toHaveBeenCalledWith("/auth/refresh");
  });

  it("queues concurrent 401 requests behind one refresh call", async () => {
    const harness = makeClientHarness();
    const s = storage();
    const refresh = Promise.resolve({
      data: {
        data: { accessToken: "new-access" },
      },
    });
    mocks.post.mockReturnValue(refresh);
    harness.api.mockImplementation(async (config: any) => ({ config }));
    createApiClient({
      baseURL: "/api",
      timeout: 1000,
      storage: s,
      onRefreshFailure: vi.fn(),
    });
    const handler = installedInterceptors(harness).responseRejected;

    const first = { url: "/one", headers: {} as Record<string, string> };
    const second = { url: "/two", headers: {} as Record<string, string> };
    const results = await Promise.all([
      handler({ response: { status: 401 }, config: first }),
      handler({ response: { status: 401 }, config: second }),
    ]);

    expect(mocks.post).toHaveBeenCalledOnce();
    expect(results[0].config.headers.Authorization).toBe("Bearer new-access");
    expect(results[1].config.headers.Authorization).toBe("Bearer new-access");
  });

  it("rejects the refresh error and fails queued requests when refresh fails", async () => {
    const harness = makeClientHarness();
    const failure = vi.fn();
    const s = storage();
    const refreshError = new Error("refresh failed");
    mocks.post.mockRejectedValue(refreshError);
    createApiClient({
      baseURL: "/api",
      timeout: 1000,
      storage: s,
      onRefreshFailure: failure,
    });
    const handler = installedInterceptors(harness).responseRejected;
    const first = handler({
      response: { status: 401 },
      config: { url: "/one", headers: {} },
    });
    const second = handler({
      response: { status: 401 },
      config: { url: "/two", headers: {} },
    });
    await expect(first).rejects.toBe(refreshError);
    await expect(second).rejects.toBe(refreshError);
    expect(failure).toHaveBeenCalledOnce();
  });
});
