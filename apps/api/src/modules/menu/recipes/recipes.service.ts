import type { AuthContext } from "@/core/auth";
import type { RecipeIngredientInput } from "@pos/types";
import { ValidationError } from "@/core/errors";
import { recipesRepository } from "./recipes.repository";
import { requirePermission } from "@/core/auth";
import { assertMenuResourceBranch } from "@/modules/menu/menu-authorization";
import { itemNotFound, inventoryItemNotFound } from "./recipes.errors";
import { menuChangeLog } from "@/modules/menu/change-log/menu-change-log";
import { areInventoryUnitsCompatible } from "@/modules/inventory/inventory-units";
import { inventoryService } from "@/modules/inventory/inventory.service";

const validateRecipeRows = async (
  tenantId: string,
  itemId: string,
  itemBranchId: string | null,
  ingredients: RecipeIngredientInput[],
) => {
  const rawIds: string[] = [];
  const subRecipeIds: string[] = [];
  const uniqueRows = new Set<string>();

  for (const ingredient of ingredients) {
    const sourceCount =
      Number(Boolean(ingredient.inventoryItemId)) +
      Number(Boolean(ingredient.subRecipeId));
    if (sourceCount !== 1) {
      throw new ValidationError(
        "Each recipe row must reference exactly one inventory item or sub-recipe",
      );
    }
    if (ingredient.variantId && ingredient.modifierOptionId) {
      throw new ValidationError(
        "A recipe row can be scoped to a variant or a modifier option, not both",
      );
    }
    if (
      ingredient.yieldPercent != null &&
      (ingredient.yieldPercent <= 0 || ingredient.yieldPercent > 100)
    ) {
      throw new ValidationError(
        "Recipe yield percent must be greater than 0 and at most 100",
      );
    }
    const sourceKey = ingredient.inventoryItemId
      ? `inventory:${ingredient.inventoryItemId}`
      : `sub-recipe:${ingredient.subRecipeId}`;
    const scopeKey = ingredient.variantId
      ? `variant:${ingredient.variantId}`
      : ingredient.modifierOptionId
        ? `modifier:${ingredient.modifierOptionId}`
        : "base";
    const uniquenessKey = `${scopeKey}|${sourceKey}`;
    if (uniqueRows.has(uniquenessKey)) {
      throw new ValidationError(
        "Duplicate recipe source for the same scope is not allowed",
      );
    }
    uniqueRows.add(uniquenessKey);

    if (ingredient.inventoryItemId) rawIds.push(ingredient.inventoryItemId);
    if (ingredient.subRecipeId) subRecipeIds.push(ingredient.subRecipeId);

    if (ingredient.variantId) {
      const variant = await recipesRepository.findVariantForItem(
        itemId,
        ingredient.variantId,
      );
      if (!variant)
        throw new ValidationError(
          "Recipe variant does not belong to this menu item",
        );
    }
    if (ingredient.modifierOptionId) {
      const option = await recipesRepository.findModifierOptionForItem(
        itemId,
        ingredient.modifierOptionId,
      );
      if (!option)
        throw new ValidationError(
          "Recipe modifier option is not attached to this menu item",
        );
    }
  }

  const [rawSources, subSources] = await Promise.all([
    recipesRepository.findOwnedInventorySources(tenantId, rawIds),
    recipesRepository.findOwnedSubRecipeSources(tenantId, subRecipeIds),
  ]);
  const rawById = new Map(rawSources.map((row) => [row.id, row] as const));
  const subById = new Map(subSources.map((row) => [row.id, row] as const));

  const missingRaw = rawIds.filter((id) => !rawById.has(id));
  if (missingRaw.length) throw inventoryItemNotFound(missingRaw);
  const missingSubs = subRecipeIds.filter((id) => !subById.has(id));
  if (missingSubs.length)
    throw new ValidationError(
      `Sub-recipe not found: ${missingSubs.join(", ")}`,
    );

  for (const ingredient of ingredients) {
    if (ingredient.inventoryItemId) {
      const source = rawById.get(ingredient.inventoryItemId)!;
      if (!areInventoryUnitsCompatible(ingredient.unit, source.unit)) {
        throw new ValidationError(
          `Recipe unit ${ingredient.unit} is incompatible with inventory unit ${source.unit}`,
        );
      }
      if (itemBranchId && source.branchId !== itemBranchId) {
        throw new ValidationError(
          "Recipe inventory item belongs to a different branch",
        );
      }
    } else if (ingredient.subRecipeId) {
      const source = subById.get(ingredient.subRecipeId)!;
      if (!itemBranchId) {
        throw new ValidationError(
          "Branch-scoped sub-recipes cannot be attached to a shared menu item",
        );
      }
      if (source.branchId !== itemBranchId) {
        throw new ValidationError("Sub-recipe belongs to a different branch");
      }
      if (!areInventoryUnitsCompatible(ingredient.unit, source.yieldUnit)) {
        throw new ValidationError(
          `Recipe unit ${ingredient.unit} is incompatible with sub-recipe yield unit ${source.yieldUnit}`,
        );
      }
    }
  }
};

export const recipesService = {
  async getItemRecipe(auth: AuthContext, itemId: string) {
    const item = await recipesRepository.findItem(auth.tenantId, itemId);
    if (!item) throw itemNotFound(itemId);
    requirePermission(auth, "menu:read");
    assertMenuResourceBranch(auth, item.branchId, { allowShared: true });
    return recipesRepository.getItemRecipe(itemId);
  },

  async setItemRecipe(
    auth: AuthContext,
    itemId: string,
    ingredients: RecipeIngredientInput[],
  ) {
    const item = await recipesRepository.findItem(auth.tenantId, itemId);
    if (!item) throw itemNotFound(itemId);
    requirePermission(auth, "menu:update");
    assertMenuResourceBranch(auth, item.branchId);

    const previousRecipe = await recipesRepository.getItemRecipe(itemId);
    await validateRecipeRows(auth.tenantId, itemId, item.branchId, ingredients);

    const recipe = await recipesRepository.replaceRecipe(
      itemId,
      ingredients.map((ingredient) => ({
        ...ingredient,
        inventoryItemId: ingredient.inventoryItemId ?? null,
        subRecipeId: ingredient.subRecipeId ?? null,
        variantId: ingredient.variantId ?? null,
        modifierOptionId: ingredient.modifierOptionId ?? null,
        yieldPercent: ingredient.yieldPercent ?? null,
        isOptional: ingredient.isOptional ?? false,
      })),
    );
    await menuChangeLog.record(auth, "RECIPE", itemId, "UPDATED", {
      ingredients,
    });
    if (item.branchId) {
      await inventoryService.syncRecipeConfigurationAvailability(
        auth.tenantId,
        item.branchId,
        itemId,
        previousRecipe.flatMap((row) => (row.variantId ? [row.variantId] : [])),
        previousRecipe.flatMap((row) =>
          row.modifierOptionId ? [row.modifierOptionId] : [],
        ),
      );
    }
    return recipe;
  },
};
