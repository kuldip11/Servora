import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("../../../../shared/lib/api-client", () => ({ apiClient: api }));

import { modifierGroupsService } from "../modifier-groups.service";

describe("modifierGroupsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists modifier groups", async () => {
    const groups = [{ id: "g1", name: "Extras" }];
    api.get.mockResolvedValue({ data: { data: groups } });
    await expect(modifierGroupsService.list()).resolves.toEqual(groups);
  });

  it("creates and updates through the appropriate endpoint", async () => {
    const payload = {
      name: "Extras",
      selectionType: "MULTIPLE" as const,
      minSelections: 0,
      options: [],
    };
    api.post.mockResolvedValue({ data: { data: { id: "g1", ...payload } } });
    await modifierGroupsService.save(null, payload);
    expect(api.post).toHaveBeenCalledWith("/menu/modifier-groups", payload);

    api.patch.mockResolvedValue({ data: { data: { id: "g1", ...payload } } });
    await modifierGroupsService.save("g1", payload);
    expect(api.patch).toHaveBeenCalledWith("/menu/modifier-groups/g1", payload);
  });

  it("removes a modifier group", async () => {
    await modifierGroupsService.remove("g1");
    expect(api.delete).toHaveBeenCalledWith("/menu/modifier-groups/g1");
  });
});
