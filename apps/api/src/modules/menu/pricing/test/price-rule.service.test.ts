import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  list,
  findById,
  create,
  createMany,
  update,
  remove,
  organizationIdForTenant,
  listOrganization,
} = vi.hoisted(() => ({
  list: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  createMany: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  organizationIdForTenant: vi.fn(),
  listOrganization: vi.fn(),
}));
const { record } = vi.hoisted(() => ({
  record: vi.fn().mockResolvedValue({ id: "event1" }),
}));
const { findByIdItem, findCategory, findIdsByCategory, findIdsByMenu } =
  vi.hoisted(() => ({
    findByIdItem: vi.fn(),
    findCategory: vi.fn(),
    findIdsByCategory: vi.fn(),
    findIdsByMenu: vi.fn(),
  }));

vi.mock("../price-rule.repository", () => ({
  priceRuleRepository: {
    list,
    findById,
    create,
    createMany,
    update,
    remove,
    organizationIdForTenant,
    listOrganization,
  },
}));
vi.mock("../../items/item.repository", () => ({
  itemRepository: {
    findById: findByIdItem,
    findCategory,
    findIdsByCategory,
    findIdsByMenu,
  },
}));
vi.mock("../../change-log/menu-change-log", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../../change-log/menu-change-log")
  >()),
  menuChangeLog: { record },
}));

import { priceRuleService } from "@/modules/menu/pricing/price-rule.service";

const auth = {
  userId: "u1",
  tenantId: "t1",
  branchId: null,
  tenantWide: true,
  email: "owner@example.com",
  roles: [],
  permissions: ["menu:pricing:write", "menu:read"],
};

const baseInput = {
  menuItemId: "item1",
  price: 100,
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  findByIdItem.mockResolvedValue({ id: "item1", branchId: null, variants: [] });
  list.mockResolvedValue([]);
  create.mockImplementation(async (data: unknown) => ({
    id: "new-rule",
    ...(data as object),
  }));
  createMany.mockImplementation(async (rows: unknown[]) =>
    rows.map((row, index) => ({ id: `bulk-${index + 1}`, ...(row as object) })),
  );
  findCategory.mockResolvedValue({ id: "cat1", branchId: null });
  findIdsByCategory.mockResolvedValue(["item1", "item2"]);
  findIdsByMenu.mockResolvedValue(["item1", "item2"]);
});

describe("price-rule service ambiguity validation (D1)", () => {
  it("allows two rules for the same item with disjoint time windows", async () => {
    list.mockResolvedValue([
      {
        id: "existing1",
        menuItemId: "item1",
        variantId: null,
        branchId: null,
        channel: "CUSTOMER_QR",
        fulfillmentType: null,
        startDate: null,
        endDate: null,
        startTime: "16:00:00",
        endTime: "18:00:00",
        priority: 0,
        isActive: true,
      },
    ]);
    await expect(
      priceRuleService.create(auth, {
        ...baseInput,
        channel: "CUSTOMER_QR",
        startTime: "18:00:00",
        endTime: "20:00:00",
      } as never),
    ).resolves.toBeDefined();
  });

  it("allows rules with different specificity even if windows overlap", async () => {
    list.mockResolvedValue([
      {
        id: "existing1",
        menuItemId: "item1",
        variantId: null,
        branchId: null,
        channel: "CUSTOMER_QR",
        fulfillmentType: null,
        startDate: null,
        endDate: null,
        startTime: "16:00:00",
        endTime: "18:00:00",
        priority: 0,
        isActive: true,
      },
    ]);
    await expect(
      priceRuleService.create(auth, {
        ...baseInput,
        channel: "CUSTOMER_QR",
        fulfillmentType: "DELIVERY",
        startTime: "16:00:00",
        endTime: "18:00:00",
      } as never),
    ).resolves.toBeDefined();
  });

  it("rejects cross-dimension scopes that can match the same context at equal specificity and priority", async () => {
    list.mockResolvedValue([
      {
        id: "existing1",
        menuItemId: "item1",
        variantId: null,
        branchId: "b1",
        channel: null,
        fulfillmentType: null,
        startDate: null,
        endDate: null,
        startTime: "16:00:00",
        endTime: "18:00:00",
        priority: 0,
        isActive: true,
      },
    ]);
    await expect(
      priceRuleService.create(auth, {
        ...baseInput,
        channel: "CUSTOMER_QR",
        startTime: "16:00:00",
        endTime: "18:00:00",
      } as never),
    ).rejects.toThrow(/ambiguous/i);
  });

  it("rejects a same-scope rule whose overlapping time window ties on specificity and priority", async () => {
    list.mockResolvedValue([
      {
        id: "existing1",
        menuItemId: "item1",
        variantId: null,
        branchId: null,
        channel: "CUSTOMER_QR",
        fulfillmentType: null,
        startDate: null,
        endDate: null,
        startTime: "16:00:00",
        endTime: "18:00:00",
        priority: 0,
        isActive: true,
      },
    ]);
    await expect(
      priceRuleService.create(auth, {
        ...baseInput,
        channel: "CUSTOMER_QR",
        startTime: "17:00:00",
        endTime: "19:00:00",
      } as never),
    ).rejects.toThrow(/ambiguous/i);
  });

  it("rejects an overnight window overlapping a same-scope daytime rule", async () => {
    findByIdItem.mockResolvedValue({
      id: "item1",
      branchId: "b1",
      variants: [],
    });
    list.mockResolvedValue([
      {
        id: "existing1",
        menuItemId: "item1",
        variantId: null,
        branchId: "b1",
        channel: null,
        fulfillmentType: null,
        startDate: null,
        endDate: null,
        startTime: "22:00:00",
        endTime: "02:00:00",
        priority: 0,
        isActive: true,
      },
    ]);
    await expect(
      priceRuleService.create(auth, {
        ...baseInput,
        branchId: "b1",
        startTime: "01:00:00",
        endTime: "05:00:00",
      } as never),
    ).rejects.toThrow(/ambiguous/i);
  });

  it("does not flag overlap when priority disambiguates the tie", async () => {
    list.mockResolvedValue([
      {
        id: "existing1",
        menuItemId: "item1",
        variantId: null,
        branchId: null,
        channel: "CUSTOMER_QR",
        fulfillmentType: null,
        startDate: null,
        endDate: null,
        startTime: "16:00:00",
        endTime: "18:00:00",
        priority: 5,
        isActive: true,
      },
    ]);
    await expect(
      priceRuleService.create(auth, {
        ...baseInput,
        channel: "CUSTOMER_QR",
        startTime: "17:00:00",
        endTime: "19:00:00",
        priority: 0,
      } as never),
    ).resolves.toBeDefined();
  });

  it("ignores inactive rules and the rule's own id when updating", async () => {
    findById.mockResolvedValue({
      id: "existing1",
      menuItemId: "item1",
      variantId: null,
      branchId: null,
      channel: "CUSTOMER_QR",
      fulfillmentType: null,
      startDate: null,
      endDate: null,
      startTime: "16:00:00",
      endTime: "18:00:00",
      priority: 0,
      price: "10.00",
      taxRate: null,
      isActive: true,
    });
    list.mockResolvedValue([
      {
        id: "existing1",
        menuItemId: "item1",
        variantId: null,
        branchId: null,
        channel: "CUSTOMER_QR",
        fulfillmentType: null,
        startDate: null,
        endDate: null,
        startTime: "16:00:00",
        endTime: "18:00:00",
        priority: 0,
        isActive: true,
      },
      {
        id: "inactive-rule",
        menuItemId: "item1",
        variantId: null,
        branchId: null,
        channel: "CUSTOMER_QR",
        fulfillmentType: null,
        startDate: null,
        endDate: null,
        startTime: "16:00:00",
        endTime: "18:00:00",
        priority: 0,
        isActive: false,
      },
    ]);
    update.mockResolvedValue({ id: "existing1" });
    await expect(
      priceRuleService.update(auth, "existing1", { price: 12 } as never),
    ).resolves.toBeDefined();
  });
});

describe("price-rule happy-hour bulk authoring (D4)", () => {
  it("creates one percent-off rule per item in the selected category", async () => {
    findByIdItem.mockImplementation(
      async (_tenantId: string, itemId: string) => ({
        id: itemId,
        branchId: null,
        variants: [],
      }),
    );
    const created = await priceRuleService.createHappyHour(auth, {
      categoryId: "cat1",
      percentOff: 20,
      startTime: "16:00:00",
      endTime: "18:00:00",
    });
    expect(created).toHaveLength(2);
    expect(createMany).toHaveBeenCalledWith([
      expect.objectContaining({
        tenantId: "t1",
        menuItemId: "item1",
        price: null,
        percentOff: "20",
        startTime: "16:00:00",
        endTime: "18:00:00",
      }),
      expect.objectContaining({
        tenantId: "t1",
        menuItemId: "item2",
        price: null,
        percentOff: "20",
        startTime: "16:00:00",
        endTime: "18:00:00",
      }),
    ]);
  });

  it("requires exactly one category/menu scope", async () => {
    await expect(
      priceRuleService.createHappyHour(auth, {
        percentOff: 20,
        startTime: "16:00:00",
        endTime: "18:00:00",
      }),
    ).rejects.toThrow(/exactly one/i);
    await expect(
      priceRuleService.createHappyHour(auth, {
        categoryId: "cat1",
        menuId: "menu1",
        percentOff: 20,
        startTime: "16:00:00",
        endTime: "18:00:00",
      }),
    ).rejects.toThrow(/exactly one/i);
  });
});

describe("G7 organization price-rule authorization", () => {
  const orgRule = {
    id: "org-rule",
    tenantId: null,
    organizationId: "org-1",
    menuItemId: null,
    menuItemSku: "PIZZA-1",
    variantId: null,
    branchId: null,
    channel: null,
    fulfillmentType: null,
    customerGroupId: null,
    coverTier: null,
    startDate: null,
    endDate: null,
    startTime: null,
    endTime: null,
    priority: 0,
    price: "90",
    percentOff: null,
    taxRate: null,
    isActive: true,
  };

  beforeEach(() => {
    findById.mockResolvedValue(orgRule);
    organizationIdForTenant.mockResolvedValue("org-1");
    listOrganization.mockResolvedValue([orgRule]);
    remove.mockResolvedValue(undefined);
  });

  it("blocks update/delete of organization rules without organization:manage", async () => {
    await expect(
      priceRuleService.update(auth, "org-rule", { price: 85 } as never),
    ).rejects.toThrow(/permission/i);
    await expect(priceRuleService.remove(auth, "org-rule")).rejects.toThrow(
      /permission/i,
    );
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it("allows organization rule deletion only from a tenant in that organization", async () => {
    const orgAuth = {
      ...auth,
      permissions: [...auth.permissions, "organization:manage"],
    };
    organizationIdForTenant.mockResolvedValue("org-2");
    await expect(priceRuleService.remove(orgAuth, "org-rule")).rejects.toThrow(
      /outside the active tenant organization/i,
    );
    expect(remove).not.toHaveBeenCalled();

    organizationIdForTenant.mockResolvedValue("org-1");
    await expect(
      priceRuleService.remove(orgAuth, "org-rule"),
    ).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith("t1", "org-rule");
  });
});
