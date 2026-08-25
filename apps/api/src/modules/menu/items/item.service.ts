/**
 * Menu item service — orchestrates `item.repository.ts` and applies the
 * business rules that used to live inline in the controller: branch
 * resolution on create, price-to-string conversion for Drizzle's numeric
 * columns, splitting tag/allergen/modifier-group/image links out of the
 * main item patch, and the publish/unpublish role restriction.
 */
import type { FoodType, MenuItemStatus, SpiceLevel } from '@pos/types';
import type { AuthContext } from '../../../core/auth';
import { requirePermission } from '../../../core/auth';
import { assertMenuResourceBranch, resolveMenuBranch } from '../menu-authorization';
import { itemRepository } from './item.repository';
import { modifierRepository } from '../modifiers/modifier.repository';
import { itemNotFound } from './item.errors';

export interface CreateItemInput {
  categoryId: string;
  name: string;
  description?: string | undefined;
  basePrice: number;
  taxRate?: number | undefined;
  branchId?: string | undefined;
  foodType?: FoodType | undefined;
  spiceLevel?: SpiceLevel | undefined;
  sku?: string | undefined;
  prepTimeMinutes?: number | undefined;
  sortOrder?: number | undefined;
  hsnCode?: string | undefined;
  status?: MenuItemStatus | undefined;
  enableRecipeDeduction?: boolean | undefined;
  isPublished?: boolean | undefined;
  variants?: Array<{ name: string; price: number }> | undefined;
  modifierGroupIds?: string[] | undefined;
  tagIds?: string[] | undefined;
  allergenIds?: string[] | undefined;
  imageUrls?: string[] | undefined;
}

export interface UpdateItemInput {
  name?: string | undefined;
  description?: string | undefined;
  basePrice?: number | undefined;
  taxRate?: number | undefined;
  isAvailable?: boolean | undefined;
  foodType?: FoodType | undefined;
  spiceLevel?: SpiceLevel | null | undefined;
  sku?: string | null | undefined;
  prepTimeMinutes?: number | null | undefined;
  sortOrder?: number | undefined;
  hsnCode?: string | null | undefined;
  status?: MenuItemStatus | undefined;
  availabilityReason?: string | null | undefined;
  enableRecipeDeduction?: boolean | undefined;
  tagIds?: string[] | undefined;
  allergenIds?: string[] | undefined;
  modifierGroupIds?: string[] | undefined;
  imageUrls?: string[] | undefined;
}

export interface DuplicateItemInput {
  name?: string | undefined;
  copyRecipes?: boolean | undefined;
  copySchedules?: boolean | undefined;
  copyModifiers?: boolean | undefined;
}

async function validateReferences(
  tenantId: string,
  branchId: string | null | undefined,
  tagIds: string[] | undefined,
  modifierGroupIds: string[] | undefined,
) {
  if (tagIds?.length) {
    const ownedTags = await modifierRepository.findOwnedTagIds(tenantId, tagIds);
    const invalid = tagIds.filter((id) => !ownedTags.has(id));
    if (invalid.length) throw new Error('One or more menu tags do not belong to this tenant');
  }

  if (modifierGroupIds?.length) {
    const ownedGroups = await modifierRepository.findOwnedModifierGroupIds(tenantId, branchId ?? null, modifierGroupIds);
    const invalid = modifierGroupIds.filter((id) => !ownedGroups.has(id));
    if (invalid.length) throw new Error('One or more modifier groups are outside the active tenant or branch');
  }
}


export const itemService = {
  async getById(auth: AuthContext, itemId: string) {
    requirePermission(auth, 'menu:read');
    const item = await itemRepository.findById(auth.tenantId, itemId);
    if (!item) throw itemNotFound(itemId);
    assertMenuResourceBranch(auth, item.branchId, { allowShared: true });
    return item;
  },

  async create(auth: AuthContext, input: CreateItemInput) {
    requirePermission(auth, 'menu:create');
    const branchId = resolveMenuBranch(auth, input.branchId);
    const category = await itemRepository.findCategory(auth.tenantId, input.categoryId);
    if (!category) throw itemNotFound(input.categoryId);
    if (category.branchId && category.branchId !== branchId) {
      throw new Error('Category branch does not match the active menu branch');
    }
    await validateReferences(auth.tenantId, branchId, input.tagIds, input.modifierGroupIds);
    return itemRepository.create({
      tenantId: auth.tenantId,
      ...input,
      branchId,
      basePrice: String(input.basePrice),
      taxRate: input.taxRate !== undefined ? String(input.taxRate) : '0',
      variants: input.variants?.map((v) => ({ name: v.name, price: String(v.price) })),
    });
  },

  async update(auth: AuthContext, itemId: string, input: UpdateItemInput) {
    requirePermission(auth, 'menu:update');
    const existing = await itemRepository.findById(auth.tenantId, itemId);
    if (!existing) throw itemNotFound(itemId);
    assertMenuResourceBranch(auth, existing.branchId);
    const { tagIds, allergenIds, modifierGroupIds, imageUrls, ...itemFields } = input;
    await validateReferences(auth.tenantId, existing.branchId, tagIds, modifierGroupIds);

    const updated = await itemRepository.update(auth.tenantId, itemId, {
      ...itemFields,
      basePrice: itemFields.basePrice !== undefined ? String(itemFields.basePrice) : undefined,
      taxRate: itemFields.taxRate !== undefined ? String(itemFields.taxRate) : undefined,
    });
    if (!updated) throw itemNotFound(itemId);

    if (tagIds !== undefined) await itemRepository.setTags(auth.tenantId, itemId, tagIds);
    if (allergenIds !== undefined) await itemRepository.setAllergens(auth.tenantId, itemId, allergenIds);
    if (modifierGroupIds !== undefined) await itemRepository.setModifierGroups(auth.tenantId, itemId, modifierGroupIds);
    if (imageUrls !== undefined) await itemRepository.setImages(auth.tenantId, itemId, imageUrls);

    return itemRepository.findById(auth.tenantId, itemId);
  },

  // Soft-delete is fire-and-forget by design (matches the pre-refactor
  // endpoint): deleting an item that doesn't exist, or that's already
  // deleted, is a no-op rather than a 404 — the caller's intent (this item
  // should not exist) is already satisfied either way.
  async remove(auth: AuthContext, itemId: string): Promise<void> {
    requirePermission(auth, 'menu:delete');
    const existing = await itemRepository.findById(auth.tenantId, itemId);
    if (!existing) return;
    assertMenuResourceBranch(auth, existing.branchId);
    await itemRepository.softDelete(auth.tenantId, itemId);
  },

  async duplicate(auth: AuthContext, itemId: string, input: DuplicateItemInput) {
    requirePermission(auth, 'menu:create');
    const existing = await itemRepository.findById(auth.tenantId, itemId);
    if (!existing) throw itemNotFound(itemId);
    assertMenuResourceBranch(auth, existing.branchId);
    const copy = await itemRepository.duplicate(auth.tenantId, itemId, input);
    if (!copy) throw itemNotFound(itemId);
    return copy;
  },

  async publish(auth: AuthContext, itemId: string) {
    requirePermission(auth, 'menu:publish');
    const existing = await itemRepository.findById(auth.tenantId, itemId);
    if (!existing) throw itemNotFound(itemId);
    assertMenuResourceBranch(auth, existing.branchId);
    const item = await itemRepository.publish(auth.tenantId, itemId);
    if (!item) throw itemNotFound(itemId);
    return item;
  },

  async unpublish(auth: AuthContext, itemId: string) {
    requirePermission(auth, 'menu:publish');
    const existing = await itemRepository.findById(auth.tenantId, itemId);
    if (!existing) throw itemNotFound(itemId);
    assertMenuResourceBranch(auth, existing.branchId);
    const item = await itemRepository.unpublish(auth.tenantId, itemId);
    if (!item) throw itemNotFound(itemId);
    return item;
  },

  async updateStatus(auth: AuthContext, itemId: string, status: MenuItemStatus, reason?: string | undefined) {
    requirePermission(auth, 'menu:update');
    const existing = await itemRepository.findById(auth.tenantId, itemId);
    if (!existing) throw itemNotFound(itemId);
    assertMenuResourceBranch(auth, existing.branchId);
    const item = await itemRepository.updateStatus(auth.tenantId, itemId, status, reason);
    if (!item) throw itemNotFound(itemId);
    return item;
  },

  // Shorthand for the common "just toggle it on/off" case — maps to
  // ACTIVE <-> OUT_OF_STOCK without the caller needing to know the full enum.
  async updateAvailability(
    auth: AuthContext,
    itemId: string,
    isAvailable: boolean,
    reason?: string | undefined,
  ) {
    requirePermission(auth, 'menu:update');
    const existing = await itemRepository.findById(auth.tenantId, itemId);
    if (!existing) throw itemNotFound(itemId);
    assertMenuResourceBranch(auth, existing.branchId);
    const item = await itemRepository.updateStatus(
      auth.tenantId,
      itemId,
      isAvailable ? 'ACTIVE' : 'OUT_OF_STOCK',
      reason,
    );
    if (!item) throw itemNotFound(itemId);
    return item;
  },

  async listByStatus(
    auth: AuthContext,
    statuses: MenuItemStatus[],
    categoryId?: string | undefined,
  ) {
    requirePermission(auth, 'menu:read');
    resolveMenuBranch(auth);
    return itemRepository.findByStatus(auth.tenantId, auth.branchId, statuses, categoryId);
  },
};
