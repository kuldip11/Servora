import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  ensureDefaultMenu,
  list,
  listActive,
  findById,
  create,
  update,
  remove,
} = vi.hoisted(() => ({
  ensureDefaultMenu: vi
    .fn()
    .mockResolvedValue({ id: "default", isDefault: true }),
  list: vi.fn(),
  listActive: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));
const { record } = vi.hoisted(() => ({
  record: vi.fn().mockResolvedValue({ id: "event1" }),
}));

vi.mock("../menu.repository", () => ({
  menuRepository: {
    ensureDefaultMenu,
    list,
    listActive,
    findById,
    create,
    update,
    remove,
  },
}));
vi.mock("../../change-log/menu-change-log", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../../change-log/menu-change-log")
  >()),
  menuChangeLog: { record },
}));

import { menuService } from "@/modules/menu/menus/menu.service";

const auth = (permissions: string[], branchId: string | null = null) => ({
  userId: "u1",
  tenantId: "t1",
  branchId,
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
    expect(ensureDefaultMenu).toHaveBeenCalledWith("t1");
    expect(list).toHaveBeenCalledWith("t1");
    await expect(menuService.list(auth([]))).rejects.toThrow(
      "Insufficient permissions",
    );
  });

  it("repairs the default menu before resolving orderable menus", async () => {
    listActive.mockResolvedValue([{ id: "default", status: "PUBLISHED" }]);
    await expect(
      menuService.listActive(auth(["menu:read"], "b1"), "STAFF", "DINE_IN"),
    ).resolves.toEqual([{ id: "default", status: "PUBLISHED" }]);
    expect(ensureDefaultMenu).toHaveBeenCalledWith("t1");
    expect(listActive).toHaveBeenCalledWith("t1", "b1", "STAFF", "DINE_IN");
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

  it("keeps the automatic default menu published", async () => {
    findById.mockResolvedValue({ id: "default", isDefault: true });
    await expect(
      menuService.unpublish(auth(["menu:publish"]), "default"),
    ).rejects.toThrow("Default Menu must stay published");
    expect(update).not.toHaveBeenCalled();
  });

  it("protects the tenant's default menu from deletion", async () => {
    findById.mockResolvedValue({ id: "m1", isDefault: true });
    await expect(
      menuService.remove(auth(["menu:delete"]), "m1"),
    ).rejects.toThrow("Default Menu cannot be deleted");
    expect(remove).not.toHaveBeenCalled();
  });
});
