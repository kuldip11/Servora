import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  listGraph,
  findOwnedInventorySources,
  findOwnedSubRecipeSources,
  create,
  findById,
  update,
  remove,
  findDirectRecipeReferences,
} = vi.hoisted(() => ({
  listGraph: vi.fn(),
  findOwnedInventorySources: vi.fn(),
  findOwnedSubRecipeSources: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  findDirectRecipeReferences: vi.fn(),
}));

vi.mock("./sub-recipe.repository", () => ({
  subRecipeRepository: {
    listGraph,
    findOwnedInventorySources,
    findOwnedSubRecipeSources,
    create,
    findById,
    update,
    list: vi.fn(),
    delete: remove,
    findDirectRecipeReferences,
  },
}));


const { record, buildDiff } = vi.hoisted(() => ({
  record: vi.fn(),
  buildDiff: vi.fn((_before: unknown, _after: unknown) => ({})),
}));
vi.mock("../change-log/menu-change-log", () => ({
  menuChangeLog: { record },
  buildDiff,
}));

const { syncMenuItemAvailability, syncRecipeConfigurationAvailability } = vi.hoisted(() => ({
  syncMenuItemAvailability: vi.fn(),
  syncRecipeConfigurationAvailability: vi.fn(),
}));
vi.mock("../../inventory/inventory.service", () => ({
  inventoryService: { syncMenuItemAvailability, syncRecipeConfigurationAvailability },
}));

import { subRecipeService } from "./sub-recipe.service";
import type { AuthContext } from "../../../core/auth";

const auth: AuthContext = {
  userId: "u1",
  tenantId: "t1",
  branchId: "b1",
  email: "u@example.com",
  roles: [],
  permissions: ["menu:update"],
  authorizedBranchIds: ["b1"],
};

const input = (children: string[]) => ({
  name: "Sauce",
  yieldQuantity: 1,
  yieldUnit: "KG" as const,
  ingredients: children.map((ingredientSubRecipeId) => ({
    ingredientSubRecipeId,
    quantity: 1,
    unit: "KG" as const,
  })),
});

beforeEach(() => {
  vi.clearAllMocks();
  findOwnedInventorySources.mockResolvedValue([]);
  findOwnedSubRecipeSources.mockImplementation(
    async (_tenantId: string, _branchId: string, ids: string[]) =>
      ids.map((id) => ({ id, branchId: "b1", yieldUnit: "KG" })),
  );
  create.mockResolvedValue({ id: "new" });
  update.mockResolvedValue({ id: "target" });
  findById.mockResolvedValue({ id: "target", branchId: "b1" });
  findDirectRecipeReferences.mockResolvedValue([]);
  record.mockResolvedValue(undefined);
  syncMenuItemAvailability.mockResolvedValue(undefined);
  syncRecipeConfigurationAvailability.mockResolvedValue(undefined);
});

describe("subRecipeService graph safety", () => {
  it("rejects a write-time cycle", async () => {
    listGraph.mockResolvedValue([
      { id: "a", children: ["b"] },
      { id: "b", children: ["target"] },
      { id: "target", children: [] },
    ]);

    await expect(
      subRecipeService.update(auth, "target", input(["a"])),
    ).rejects.toThrow("Circular sub-recipe reference is not allowed");
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a path deeper than the maximum even when a node is also reachable by a shorter path", async () => {
    // target -> c -> d is legal at depth 3, but target -> b -> c -> d is
    // depth 4 and must still be rejected. A global visited-set algorithm
    // incorrectly skipped the deeper c -> d traversal.
    listGraph.mockResolvedValue([
      { id: "target", children: [] },
      { id: "b", children: ["c"] },
      { id: "c", children: ["d"] },
      { id: "d", children: [] },
    ]);

    await expect(
      subRecipeService.update(auth, "target", input(["c", "b"])),
    ).rejects.toThrow("Sub-recipes may nest at most 3 levels");
    expect(update).not.toHaveBeenCalled();
  });

  it("accepts a three-level acyclic graph", async () => {
    listGraph.mockResolvedValue([
      { id: "target", children: [] },
      { id: "b", children: ["c"] },
      { id: "c", children: [] },
    ]);

    await expect(
      subRecipeService.update(auth, "target", input(["b"])),
    ).resolves.toEqual({ id: "target" });
  });

  it("rejects raw ingredients outside the active branch", async () => {
    listGraph.mockResolvedValue([]);
    findOwnedInventorySources.mockResolvedValue([]);

    await expect(
      subRecipeService.create(auth, {
        name: "Sauce", yieldQuantity: 1, yieldUnit: "KG",
        ingredients: [{ inventoryItemId: "raw-b2", quantity: 1, unit: "KG" }],
      }),
    ).rejects.toThrow("outside the active branch");
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects incompatible source units at write time", async () => {
    listGraph.mockResolvedValue([]);
    findOwnedInventorySources.mockResolvedValue([
      { id: "raw-1", branchId: "b1", unit: "KG" },
    ]);

    await expect(
      subRecipeService.create(auth, {
        name: "Sauce", yieldQuantity: 1, yieldUnit: "KG",
        ingredients: [{ inventoryItemId: "raw-1", quantity: 1, unit: "ML" }],
      }),
    ).rejects.toThrow("incompatible with inventory unit");
  });
});
