import { beforeEach, describe, expect, it, vi } from "vitest";

const { list, findById, create, update, remove } = vi.hoisted(() => ({
  list: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));
const { record } = vi.hoisted(() => ({
  record: vi.fn().mockResolvedValue({ id: "event1" }),
}));

vi.mock("../menu.repository", () => ({
  menuRepository: { list, findById, create, update, remove },
}));
vi.mock("../../change-log/menu-change-log", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../../change-log/menu-change-log")
  >()),
  menuChangeLog: { record },
}));

import { menuService } from "@/modules/menu/menus/menu.service";

const auth = (permissions: string[]) => ({
  userId: "u1",
  tenantId: "t1",
  branchId: null,
  email: "owner@example.com",
  roles: [],
  permissions,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("menu service", () => {
  it("keeps reads tenant scoped and permission guarded", async () => {
    list.mockResolvedValue([{ id: "m1" }]);
    await expect(menuService.list(auth(["menu:read"]))).resolves.toEqual([
      { id: "m1" },
    ]);
    expect(list).toHaveBeenCalledWith("t1");
    await expect(menuService.list(auth([]))).rejects.toThrow(
      "Insufficient permissions",
    );
  });

  it("creates draft menus through the tenant repository", async () => {
    create.mockResolvedValue({ id: "m2", status: "DRAFT" });
    await expect(
      menuService.create(auth(["menu:create"]), { name: "Weekend" }),
    ).resolves.toMatchObject({ id: "m2", status: "DRAFT" });
    expect(create).toHaveBeenCalledWith({ tenantId: "t1", name: "Weekend" });
  });

  it("publishes and unpublishes an existing menu", async () => {
    findById.mockResolvedValue({ id: "m1", isDefault: false });
    update
      .mockResolvedValueOnce({ id: "m1", status: "PUBLISHED" })
      .mockResolvedValueOnce({ id: "m1", status: "DRAFT" });
    await menuService.publish(auth(["menu:publish"]), "m1");
    await menuService.unpublish(auth(["menu:publish"]), "m1");
    expect(update).toHaveBeenNthCalledWith(1, "t1", "m1", {
      status: "PUBLISHED",
    });
    expect(update).toHaveBeenNthCalledWith(2, "t1", "m1", {
      status: "DRAFT",
    });
  });

  it("protects the tenant's default menu from deletion", async () => {
    findById.mockResolvedValue({ id: "m1", isDefault: true });
    await expect(
      menuService.remove(auth(["menu:delete"]), "m1"),
    ).rejects.toThrow("Default Menu cannot be deleted");
    expect(remove).not.toHaveBeenCalled();
  });
});
