import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findItem,
  findVariantForItem,
  findModifierOptionForItem,
  findOwnedInventorySources,
  findOwnedSubRecipeSources,
  getItemRecipe,
  replaceRecipe,
} = vi.hoisted(() => ({
  findItem: vi.fn(),
  findVariantForItem: vi.fn(),
  findModifierOptionForItem: vi.fn(),
  findOwnedInventorySources: vi.fn(),
  findOwnedSubRecipeSources: vi.fn(),
  getItemRecipe: vi.fn(),
  replaceRecipe: vi.fn(),
}));

vi.mock("../recipes.repository", () => ({
  recipesRepository: {
    findItem,
    findVariantForItem,
    findModifierOptionForItem,
    findOwnedInventorySources,
    findOwnedSubRecipeSources,
    getItemRecipe,
    replaceRecipe,
  },
}));

const { record } = vi.hoisted(() => ({ record: vi.fn() }));
vi.mock("../../change-log/menu-change-log", () => ({
  menuChangeLog: { record },
}));

const { syncRecipeConfigurationAvailability } = vi.hoisted(() => ({
  syncRecipeConfigurationAvailability: vi.fn(),
}));
vi.mock("../../../inventory/inventory.service", () => ({
  inventoryService: { syncRecipeConfigurationAvailability },
}));

import { recipesService } from "../recipes.service";
import type { AuthContext } from "../../../../core/auth";

const auth: AuthContext = {
  userId: "u1",
  tenantId: "t1",
  branchId: "b1",
  email: "u@example.com",
  roles: [],
  permissions: ["menu:update"],
  authorizedBranchIds: ["b1"],
};

beforeEach(() => {
  vi.clearAllMocks();
  findItem.mockResolvedValue({ id: "m1", branchId: "b1", enableRecipeDeduction: true });
  findOwnedInventorySources.mockResolvedValue([]);
  findOwnedSubRecipeSources.mockResolvedValue([]);
  getItemRecipe.mockResolvedValue([]);
  replaceRecipe.mockResolvedValue([]);
  record.mockResolvedValue(undefined);
  syncRecipeConfigurationAvailability.mockResolvedValue(undefined);
});

describe("recipesService Phase E source validation", () => {
  it("accepts compatible mass units for a branch-local sub-recipe", async () => {
    findOwnedSubRecipeSources.mockResolvedValue([
      { id: "sr1", branchId: "b1", yieldUnit: "KG" },
    ]);
    replaceRecipe.mockResolvedValue([{ id: "r1" }]);

    await expect(
      recipesService.setItemRecipe(auth, "m1", [
        { subRecipeId: "sr1", quantity: 500, unit: "GRAMS" },
      ]),
    ).resolves.toEqual([{ id: "r1" }]);
  });

  it("rejects a sub-recipe from another branch at write time", async () => {
    findOwnedSubRecipeSources.mockResolvedValue([
      { id: "sr1", branchId: "b2", yieldUnit: "KG" },
    ]);

    await expect(
      recipesService.setItemRecipe(auth, "m1", [
        { subRecipeId: "sr1", quantity: 1, unit: "KG" },
      ]),
    ).rejects.toThrow("different branch");
    expect(replaceRecipe).not.toHaveBeenCalled();
  });

  it("rejects an incompatible recipe/sub-recipe unit pair at write time", async () => {
    findOwnedSubRecipeSources.mockResolvedValue([
      { id: "sr1", branchId: "b1", yieldUnit: "KG" },
    ]);

    await expect(
      recipesService.setItemRecipe(auth, "m1", [
        { subRecipeId: "sr1", quantity: 1, unit: "ML" },
      ]),
    ).rejects.toThrow("incompatible with sub-recipe yield unit");
  });
  it("rejects duplicate sources inside the same recipe scope", async () => {
    findOwnedInventorySources.mockResolvedValue([
      { id: "i1", branchId: "b1", unit: "KG" },
    ]);

    await expect(
      recipesService.setItemRecipe(auth, "m1", [
        { inventoryItemId: "i1", quantity: 1, unit: "KG" },
        { inventoryItemId: "i1", quantity: 2, unit: "KG" },
      ]),
    ).rejects.toThrow("Duplicate recipe source");
    expect(replaceRecipe).not.toHaveBeenCalled();
  });

});
