import { describe, expect, it, vi } from "vitest";
import { apiClient } from "../../../../shared/lib/api-client";
import { fetchMemberships, login } from "../login";

vi.mock("../../../../shared/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

describe("auth API", () => {
  it("posts credentials and returns login data", async () => {
    const payload = {
      accessToken: "a",
      refreshToken: "r",
      expiresIn: 3600,
      user: { id: "u1" },
    };
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { data: payload },
    } as any);
    await expect(login("a@b.com", "secret")).resolves.toEqual(payload);
    expect(apiClient.post).toHaveBeenCalledWith("/auth/login", {
      email: "a@b.com",
      password: "secret",
    });
  });

  it("returns available memberships", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: [{ id: "m1" }] },
    } as any);
    await expect(fetchMemberships()).resolves.toEqual([{ id: "m1" }]);
    expect(apiClient.get).toHaveBeenCalledWith("/auth/memberships");
  });
});
