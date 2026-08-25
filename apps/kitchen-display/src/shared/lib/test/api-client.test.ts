import { describe, expect, it, vi } from "vitest";
import type { ApiClientConfig } from "@pos/api-client";

const mocks = vi.hoisted(() => ({
  createApiClient: vi.fn((_config: ApiClientConfig) => ({})),
}));

vi.mock("@pos/api-client", () => ({
  createApiClient: mocks.createApiClient,
}));

import { apiClient } from "../api-client";

describe("api client", () => {
  it("creates client with storage", () => {
    expect(apiClient).toBeTruthy();
    const config = mocks.createApiClient.mock.calls[0]?.[0];
    expect(config).toBeDefined();
    expect(config?.timeout).toBe(15000);
    expect(config?.storage.getAccessToken).toBeTypeOf("function");
  });
});
