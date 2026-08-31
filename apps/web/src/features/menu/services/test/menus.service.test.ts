import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("../../../../shared/lib/api-client", () => ({ apiClient: api }));

import { menusService } from "@/features/menu/services/menus.service";

describe("menusService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists and creates menus", async () => {
    const menu = { id: "m1", name: "Default Menu" };
    api.get.mockResolvedValue({ data: { data: [menu] } });
    api.post.mockResolvedValue({ data: { data: menu } });
    await expect(menusService.list()).resolves.toEqual([menu]);
    await expect(menusService.create({ name: "Lunch" })).resolves.toEqual(menu);
    expect(api.post).toHaveBeenCalledWith("/menu/menus", { name: "Lunch" });
  });

  it("publishes, unpublishes, and deletes through lifecycle routes", async () => {
    api.post.mockResolvedValue({ data: { data: { id: "m1" } } });
    await menusService.publish("m1");
    await menusService.unpublish("m1");
    await menusService.remove("m1");
    expect(api.post).toHaveBeenNthCalledWith(1, "/menu/menus/m1/publish");
    expect(api.post).toHaveBeenNthCalledWith(2, "/menu/menus/m1/unpublish");
    expect(api.delete).toHaveBeenCalledWith("/menu/menus/m1");
  });
});
