import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createApiClient: vi.fn((config: unknown) => ({
    post: vi.fn(),
    get: vi.fn(),
    __config: config,
  })),
}));

vi.mock("@pos/api-client", () => ({
  createApiClient: mocks.createApiClient,
}));

import { apiClient } from "@/shared/lib/api-client";

describe("api client", () => {
  it("creates the shared client with waiter storage", () => {
    expect(apiClient).toBeTruthy();
    expect(mocks.createApiClient).toHaveBeenCalledTimes(1);
    expect(mocks.createApiClient).toHaveBeenCalledWith(
      expect.objectContaining({ timeout: 15_000 }),
    );

    const config = mocks.createApiClient.mock.calls[0]?.[0] as
      | {
          storage?: { getAccessToken: () => string | null };
        }
      | undefined;
    expect(config).toBeDefined();
    expect(config?.storage?.getAccessToken).toBeTypeOf("function");
  });
});
