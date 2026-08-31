import { describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/lib/api-client";
import { fetchMyBranch } from "@/features/menu/api/branch";

vi.mock("../../../../shared/lib/api-client", () => ({
  apiClient: { get: vi.fn() },
}));

describe("fetchMyBranch", () => {
  it("selects the first branch from the API response", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: [{ id: "b1" }, { id: "b2" }] },
    } as any);
    await expect(fetchMyBranch()).resolves.toEqual({ id: "b1" });
    expect(apiClient.get).toHaveBeenCalledWith("/branches");
  });
});
