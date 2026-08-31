import type { AuthContext } from "../../../core/auth";
import { requireBranch, requirePermission } from "../../../core/auth";
import { ValidationError, NotFoundError } from "../../../core/errors";
import type { SubRecipeInput } from "@pos/types";
import { subRecipeRepository, type SubRecipeIngredientWrite } from "./sub-recipe.repository";
import { areInventoryUnitsCompatible } from "../../inventory/inventory-units";
import { menuChangeLog, buildDiff } from "../change-log/menu-change-log";
import { inventoryService } from "../../inventory/inventory.service";

import { MAX_SUB_RECIPE_DEPTH } from "./constants";

async function validateSources(
  tenantId: string,
  branchId: string,
  ingredients: SubRecipeIngredientWrite[],
) {
  if (!ingredients.length) {
    throw new ValidationError("A sub-recipe must contain at least one ingredient");
  }

  const rawIds: string[] = [];
  const nestedIds: string[] = [];
  for (const ingredient of ingredients) {
    if (Number(Boolean(ingredient.inventoryItemId)) + Number(Boolean(ingredient.ingredientSubRecipeId)) !== 1) {
      throw new ValidationError("Each sub-recipe ingredient must reference exactly one raw inventory item or sub-recipe");
    }
    if (ingredient.quantity <= 0) throw new ValidationError("Sub-recipe ingredient quantity must be greater than zero");
    if (ingredient.inventoryItemId) rawIds.push(ingredient.inventoryItemId);
    if (ingredient.ingredientSubRecipeId) nestedIds.push(ingredient.ingredientSubRecipeId);
  }

  const [rawSources, nestedSources] = await Promise.all([
    subRecipeRepository.findOwnedInventorySources(tenantId, branchId, rawIds),
    subRecipeRepository.findOwnedSubRecipeSources(tenantId, branchId, nestedIds),
  ]);
  const rawById = new Map(rawSources.map((row) => [row.id, row] as const));
  const nestedById = new Map(nestedSources.map((row) => [row.id, row] as const));

  for (const ingredient of ingredients) {
    if (ingredient.inventoryItemId) {
      const source = rawById.get(ingredient.inventoryItemId);
      if (!source) {
        throw new ValidationError("Sub-recipe references inventory outside the active branch");
      }
      if (!areInventoryUnitsCompatible(ingredient.unit, source.unit)) {
        throw new ValidationError(
          `Ingredient unit ${ingredient.unit} is incompatible with inventory unit ${source.unit}`,
        );
      }
    } else if (ingredient.ingredientSubRecipeId) {
      const source = nestedById.get(ingredient.ingredientSubRecipeId);
      if (!source) {
        throw new ValidationError("Sub-recipe references a component outside the active branch");
      }
      if (!areInventoryUnitsCompatible(ingredient.unit, source.yieldUnit)) {
        throw new ValidationError(
          `Ingredient unit ${ingredient.unit} is incompatible with component yield unit ${source.yieldUnit}`,
        );
      }
    }
  }
}

async function assertGraphSafe(tenantId: string, targetId: string | null, children: string[]) {
  const rows = await subRecipeRepository.listGraph(tenantId);
  const graph = new Map(rows.map((row) => [row.id, row.children] as const));
  const nodeId = targetId ?? "__new_sub_recipe__";
  graph.set(nodeId, children);

  function walk(id: string, depth: number, path: Set<string>): void {

    if (path.has(id)) {
      throw new ValidationError("Circular sub-recipe reference is not allowed");
    }
    if (depth > MAX_SUB_RECIPE_DEPTH) {
      throw new ValidationError(
        `Sub-recipes may nest at most ${MAX_SUB_RECIPE_DEPTH} levels`,
      );
    }

    const nextPath = new Set(path);
    nextPath.add(id);

    for (const child of graph.get(id) ?? []) {
      walk(child, depth + 1, nextPath);
    }
  }

  walk(nodeId, 1, new Set());

  if (targetId) {
    for (const id of graph.keys()) walk(id, 1, new Set());
  }
}

function validateYield(input: SubRecipeInput) {
  if (!input.name.trim()) throw new ValidationError("Sub-recipe name is required");
  if (input.yieldQuantity <= 0) throw new ValidationError("Sub-recipe yield quantity must be greater than zero");
  if (input.yieldPercent != null && (input.yieldPercent <= 0 || input.yieldPercent > 100)) {
    throw new ValidationError("Yield percent must be greater than 0 and at most 100");
  }
}

export const subRecipeService = {
  async list(auth: AuthContext) {
    requirePermission(auth, "menu:read");
    return subRecipeRepository.list(auth.tenantId, auth.branchId);
  },

  async create(auth: AuthContext, input: SubRecipeInput) {
    requirePermission(auth, "menu:update");
    const branchId = requireBranch(auth, "Select a branch before creating a sub-recipe");
    validateYield(input);
    await validateSources(auth.tenantId, branchId, input.ingredients);
    await assertGraphSafe(auth.tenantId, null, input.ingredients.flatMap((i) => i.ingredientSubRecipeId ? [i.ingredientSubRecipeId] : []));
    const created = await subRecipeRepository.create({ tenantId: auth.tenantId, branchId, ...input });
    if (!created) throw new NotFoundError("Sub-recipe");
    await menuChangeLog.record(auth, "SUB_RECIPE", created.id, "CREATED", buildDiff(null, created));
    await inventoryService.syncMenuItemAvailability(auth.tenantId, branchId, ["recipe-configuration-change"]);
    return created;
  },

  async update(auth: AuthContext, id: string, input: SubRecipeInput) {
    requirePermission(auth, "menu:update");
    const branchId = requireBranch(auth, "Select a branch before editing a sub-recipe");
    const existing = await subRecipeRepository.findById(auth.tenantId, id);
    if (!existing || existing.branchId !== branchId) throw new NotFoundError("Sub-recipe");
    validateYield(input);
    if (input.ingredients.some((ingredient) => ingredient.ingredientSubRecipeId === id)) {
      throw new ValidationError("A sub-recipe cannot include itself");
    }
    await validateSources(auth.tenantId, branchId, input.ingredients);
    await assertGraphSafe(auth.tenantId, id, input.ingredients.flatMap((i) => i.ingredientSubRecipeId ? [i.ingredientSubRecipeId] : []));
    const updated = await subRecipeRepository.update(id, { branchId, ...input });
    if (!updated) throw new NotFoundError("Sub-recipe");
    await menuChangeLog.record(auth, "SUB_RECIPE", id, "UPDATED", buildDiff(existing, updated));
    await inventoryService.syncMenuItemAvailability(auth.tenantId, branchId, ["recipe-configuration-change"]);
    return updated;
  },

  async delete(auth: AuthContext, id: string) {
    requirePermission(auth, "menu:update");
    const branchId = requireBranch(auth, "Select a branch before deleting a sub-recipe");
    const existing = await subRecipeRepository.findById(auth.tenantId, id);
    if (!existing || existing.branchId !== branchId) throw new NotFoundError("Sub-recipe");
    const references = await subRecipeRepository.findDirectRecipeReferences(id);
    await subRecipeRepository.delete(id);
    await menuChangeLog.record(auth, "SUB_RECIPE", id, "DELETED", buildDiff(existing, null));
    const byItem = new Map<string, { variants: string[]; modifiers: string[] }>();
    for (const ref of references) {
      const entry = byItem.get(ref.menuItemId) ?? { variants: [], modifiers: [] };
      if (ref.variantId) entry.variants.push(ref.variantId);
      if (ref.modifierOptionId) entry.modifiers.push(ref.modifierOptionId);
      byItem.set(ref.menuItemId, entry);
    }
    for (const [menuItemId, scopes] of byItem) {
      await inventoryService.syncRecipeConfigurationAvailability(
        auth.tenantId, branchId, menuItemId, scopes.variants, scopes.modifiers,
      );
    }
    await inventoryService.syncMenuItemAvailability(auth.tenantId, branchId, ["recipe-configuration-change"]);
  },
};
