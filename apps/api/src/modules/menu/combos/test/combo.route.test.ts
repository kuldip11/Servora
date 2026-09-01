import { beforeEach, describe, expect, it, vi } from "vitest";

const { findCombo, findItem, writeAudit, transaction, usageRows } = vi.hoisted(
  () => ({
    findCombo: vi.fn(),
    findItem: vi.fn(),
    writeAudit: vi.fn(),
    transaction: vi.fn(),
    usageRows: [] as Array<{ id: string }>,
  }),
);

vi.mock("elysia", async (importOriginal) => {
  const actual = await importOriginal<typeof import("elysia")>();
  class FakeElysia {
    routes: Array<{
      method: string;
      path: string;
      handler: Function | undefined;
    }> = [];
    use() {
      return this;
    }
    get(path: string, handler?: Function) {
      this.routes.push({ method: "GET", path, handler });
      return this;
    }
    post(path: string, handler?: Function) {
      this.routes.push({ method: "POST", path, handler });
      return this;
    }
    patch(path: string, handler?: Function) {
      this.routes.push({ method: "PATCH", path, handler });
      return this;
    }
    delete(path: string, handler?: Function) {
      this.routes.push({ method: "DELETE", path, handler });
      return this;
    }
  }
  return { ...actual, Elysia: FakeElysia };
});

vi.mock("@/core/auth", () => ({
  requireAuthPlugin: () => ({}),
  requirePermission: vi.fn(),
}));
vi.mock("@/core/audit", () => ({ writeAudit }));
vi.mock("@/modules/menu/menu-authorization", () => ({
  assertMenuResourceBranch: vi.fn(),
}));
vi.mock("@/modules/menu/items/item.repository", () => ({
  itemRepository: { findById: findItem },
}));
vi.mock("@/db", () => ({
  db: {
    query: { combos: { findFirst: findCombo, findMany: vi.fn() } },
    select: vi.fn(() => ({
      from: () => ({
        where: () => ({ limit: async () => usageRows }),
      }),
    })),
    transaction,
    delete: vi.fn(() => ({ where: vi.fn() })),
  },
}));

import { combosRouter } from "@/modules/menu/combos/combo.route";

const auth = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  branchId: "22222222-2222-4222-8222-222222222222",
  userId: "33333333-3333-4333-8333-333333333333",
  requestId: "request-1",
  ipAddress: "127.0.0.1",
};
const input = {
  name: "Lunch combo",
  pricePolicy: "FIXED" as const,
  fixedPrice: 299,
  slots: [
    {
      name: "Main",
      minSelections: 1,
      maxSelections: 1,
      options: [
        {
          menuItemId: "44444444-4444-4444-8444-444444444444",
          upcharge: 0,
        },
      ],
    },
  ],
};

describe("combos.route update lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usageRows.splice(0);
    findItem.mockResolvedValue({
      id: input.slots[0]!.options[0]!.menuItemId,
      branchId: null,
      variants: [],
    });
    findCombo
      .mockResolvedValueOnce({ id: "combo-1", slots: [] })
      .mockResolvedValueOnce({ id: "combo-1", ...input, slots: [] });
  });

  it("replaces an unused combo structure atomically", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "slot-1" }]);
    const tx = {
      update: vi.fn(() => ({ set: () => ({ where: vi.fn() }) })),
      delete: vi.fn(() => ({ where: vi.fn() })),
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning })) })),
    };
    transaction.mockImplementation(async (callback) => callback(tx));
    const route = (combosRouter as any).routes.find(
      (entry: any) => entry.method === "PATCH" && entry.path === "/:id",
    );

    const result = await route.handler({
      auth,
      params: { id: "combo-1" },
      body: input,
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(tx.update).toHaveBeenCalledTimes(1);
    expect(tx.delete).toHaveBeenCalledTimes(1);
    expect(tx.insert).toHaveBeenCalledTimes(2);
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "COMBO_UPDATED", entityId: "combo-1" }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects structural edits after the combo has been ordered", async () => {
    usageRows.push({ id: "order-item-1" });
    const route = (combosRouter as any).routes.find(
      (entry: any) => entry.method === "PATCH" && entry.path === "/:id",
    );

    await expect(
      route.handler({ auth, params: { id: "combo-1" }, body: input }),
    ).rejects.toThrow("already been used in an order");
    expect(transaction).not.toHaveBeenCalled();
  });
});
