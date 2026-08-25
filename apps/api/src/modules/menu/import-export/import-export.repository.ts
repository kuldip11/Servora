/**
 * Menu import/export repository — data access for the "import-export"
 * sub-domain only. Extracted from the monolithic `menu/export.service.ts`
 * and `menu/import.service.ts` — same queries, unchanged — see
 * docs/NEXT_STEPS.md.
 */
import { eq, and, isNull, or } from 'drizzle-orm';
import { db } from '../../../db';
import { menuItems, menuCategories, modifierGroups, recipes } from '../../../db/schema';
import type { MenuItemStatus, FoodType, SpiceLevel } from '@pos/types';

export interface CommitRowData {
  id?: string | undefined;
  categoryId: string;
  name: string;
  description: string | null;
  basePrice: string;
  taxRate: string;
  foodType: FoodType;
  spiceLevel: SpiceLevel | null;
  sku: string | null;
  status: MenuItemStatus;
  hsnCode: string | null;
  prepTimeMinutes: number | null;
}

export const importExportRepository = {
  // ─── Export reads ──────────────────────────────────────────────────────

  async findItemsForExport(tenantId: string, branchId?: string | undefined) {
    return db.query.menuItems.findMany({
      where: and(
        eq(menuItems.tenantId, tenantId),
        isNull(menuItems.deletedAt),
        branchId ? eq(menuItems.branchId, branchId) : undefined,
      ),
      with: { category: true },
      orderBy: (t, { asc }) => [asc(t.sortOrder)],
    });
  },

  async findCategoriesForExport(tenantId: string, branchId?: string) {
    return db.query.menuCategories.findMany({
      where: and(eq(menuCategories.tenantId, tenantId), branchId ? or(eq(menuCategories.branchId, branchId), isNull(menuCategories.branchId)) : undefined),
      orderBy: (t, { asc }) => [asc(t.sortOrder)],
    });
  },

  // recipes has no tenantId column of its own — scoped through its parent
  // menu item, same as everywhere else recipes are read (see
  // recipes.repository.ts#getItemRecipe).
  async findRecipesForExport(tenantId: string, branchId?: string) {
    const rows = await db.query.recipes.findMany({
      with: {
        menuItem: { columns: { id: true, name: true, tenantId: true, branchId: true } },
        inventoryItem: { columns: { id: true, name: true } },
      },
    });
    return rows.filter((r) => r.menuItem.tenantId === tenantId && (!branchId || r.menuItem.branchId === branchId || r.menuItem.branchId === null));
  },

  async findModifiersForExport(tenantId: string, branchId?: string) {
    return db.query.modifierGroups.findMany({
      where: and(eq(modifierGroups.tenantId, tenantId), branchId ? or(eq(modifierGroups.branchId, branchId), isNull(modifierGroups.branchId)) : undefined),
      with: { options: true },
    });
  },

  // ─── Import reads ──────────────────────────────────────────────────────

  async findCategoriesForImport(tenantId: string, branchId?: string) {
    return db.query.menuCategories.findMany({ where: and(eq(menuCategories.tenantId, tenantId), branchId ? or(eq(menuCategories.branchId, branchId), isNull(menuCategories.branchId)) : undefined) });
  },

  async findExistingSkuItems(tenantId: string, branchId?: string) {
    return db.query.menuItems.findMany({
      where: and(eq(menuItems.tenantId, tenantId), isNull(menuItems.deletedAt), branchId ? eq(menuItems.branchId, branchId) : undefined),
      columns: { id: true, sku: true },
    });
  },

  // ─── Import writes ─────────────────────────────────────────────────────

  // Writes every valid row in one transaction — a failure partway through
  // rolls back the whole batch rather than leaving a half-imported menu.
  async commitRows(
    tenantId: string,
    branchId: string | undefined,
    rows: Array<{ action: 'insert' | 'update'; data: CommitRowData }>,
  ): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;

    await db.transaction(async (tx) => {
      for (const r of rows) {
        if (r.action === 'update' && r.data.id) {
          await tx
            .update(menuItems)
            .set({
              categoryId: r.data.categoryId,
              name: r.data.name,
              description: r.data.description,
              basePrice: r.data.basePrice,
              taxRate: r.data.taxRate,
              foodType: r.data.foodType,
              spiceLevel: r.data.spiceLevel,
              sku: r.data.sku,
              status: r.data.status,
              isAvailable: r.data.status === 'ACTIVE',
              hsnCode: r.data.hsnCode,
              prepTimeMinutes: r.data.prepTimeMinutes,
            })
            .where(and(eq(menuItems.id, r.data.id), eq(menuItems.tenantId, tenantId), branchId ? eq(menuItems.branchId, branchId) : undefined));
          updated++;
        } else {
          await tx.insert(menuItems).values({
            tenantId,
            branchId: branchId ?? null,
            categoryId: r.data.categoryId,
            name: r.data.name,
            description: r.data.description,
            basePrice: r.data.basePrice,
            taxRate: r.data.taxRate,
            foodType: r.data.foodType,
            spiceLevel: r.data.spiceLevel,
            sku: r.data.sku,
            status: r.data.status,
            isAvailable: r.data.status === 'ACTIVE',
            hsnCode: r.data.hsnCode,
            prepTimeMinutes: r.data.prepTimeMinutes,
            sortOrder: 0,
            enableRecipeDeduction: true,
          });
          inserted++;
        }
      }
    });

    return { inserted, updated };
  },
};
