import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("../../../../shared/lib/api-client", () => ({
  apiClient: { get: mocks.get, post: mocks.post },
}));

import { fetchMemberships, login } from "../login";

describe("auth api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in", async () => {
    mocks.post.mockResolvedValue({ data: { data: { accessToken: "a" } } });
    await expect(login("a@b.com", "pw")).resolves.toEqual({ accessToken: "a" });
    expect(mocks.post).toHaveBeenCalledWith("/auth/login", {
      email: "a@b.com",
      password: "pw",
    });
  });

  it("fetches memberships", async () => {
    mocks.get.mockResolvedValue({ data: { data: [{ membershipId: "m" }] } });
    await expect(fetchMemberships()).resolves.toEqual([{ membershipId: "m" }]);
    expect(mocks.get).toHaveBeenCalledWith("/auth/memberships");
  });
});
