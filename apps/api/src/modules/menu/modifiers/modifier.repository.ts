/**
 * Modifier-groups/tags/allergens repository — data access for this
 * sub-domain only. Extracted from the monolithic `modules/menu/repository.ts`
 * (still used by bulk operations, import/export, templates, recipes, which
 * haven't been split out yet — see docs/NEXT_STEPS.md). Method bodies are
 * unchanged from the legacy repository; only the module boundary moved.
 */
import { eq, and, isNull, or, asc, inArray } from "drizzle-orm";
import { db } from "../../../db";
import {
  modifierGroups,
  modifierOptions,
  menuTags,
  menuAllergens,
} from "../../../db/schema";
import { compact } from "../../../lib/object-utils";

export const modifierRepository = {
  // ─── Modifier Groups ───────────────────────────────────────────────────────

  async findModifierGroups(tenantId: string, branchId?: string) {
    return db.query.modifierGroups.findMany({
      where: and(
        eq(modifierGroups.tenantId, tenantId),
        branchId
          ? or(
              eq(modifierGroups.branchId, branchId),
              isNull(modifierGroups.branchId),
            )
          : undefined,
      ),
      orderBy: asc(modifierGroups.sortOrder),
      with: { options: { orderBy: (t, { asc }) => [asc(t.sortOrder)] } },
    });
  },

  async findModifierGroup(tenantId: string, groupId: string) {
    return db.query.modifierGroups.findFirst({
      where: and(
        eq(modifierGroups.id, groupId),
        eq(modifierGroups.tenantId, tenantId),
      ),
      columns: { id: true, branchId: true },
    });
  },

  /**
   * Validates modifier-group references before they are attached to a menu item.
   * A group may be shared across branches (NULL branchId), but a branch-scoped
   * group can only be attached to an item in that same branch.
   */
  async findOwnedModifierGroupIds(
    tenantId: string,
    branchId: string | null,
    groupIds: string[],
  ) {
    if (!groupIds.length) return new Set<string>();
    const rows = await db.query.modifierGroups.findMany({
      where: and(
        eq(modifierGroups.tenantId, tenantId),
        inArray(modifierGroups.id, groupIds),
      ),
      columns: { id: true, branchId: true },
    });
    return new Set(
      rows
        .filter(
          (row: any) => row.branchId === null || row.branchId === branchId,
        )
        .map((row: any) => row.id),
    );
  },

  async findOwnedTagIds(tenantId: string, tagIds: string[]) {
    if (!tagIds.length) return new Set<string>();
    const rows = await db.query.menuTags.findMany({
      where: and(eq(menuTags.tenantId, tenantId), inArray(menuTags.id, tagIds)),
      columns: { id: true },
    });
    return new Set(rows.map((row: any) => row.id));
  },

  async createModifierGroup(data: {
    tenantId: string;
    branchId?: string | undefined;
    name: string;
    selectionType?: "SINGLE" | "MULTIPLE" | undefined;
    minSelections?: number | undefined;
    maxSelections?: number | undefined;
    options?:
      | Array<{
          name: string;
          additionalPrice: string;
          maxQuantity?: number | undefined;
        }>
      | undefined;
  }) {
    return db.transaction(async (tx) => {
      const [group] = await tx
        .insert(modifierGroups)
        .values({
          tenantId: data.tenantId,
          branchId: data.branchId ?? null,
          name: data.name,
          selectionType: data.selectionType ?? "SINGLE",
          minSelections: data.minSelections ?? 0,
          maxSelections: data.maxSelections ?? null,
        })
        .returning();

      if (data.options?.length) {
        await tx
          .insert(modifierOptions)
          .values(
            data.options.map((o, i) =>
              compact({ modifierGroupId: group!.id, sortOrder: i, ...o }),
            ) as (typeof modifierOptions.$inferInsert)[],
          );
      }

      return tx.query.modifierGroups.findFirst({
        where: eq(modifierGroups.id, group!.id),
        with: { options: true },
      });
    });
  },

  async updateModifierGroup(
    tenantId: string,
    groupId: string,
    data: {
      name?: string | undefined;
      selectionType?: "SINGLE" | "MULTIPLE" | undefined;
      minSelections?: number | undefined;
      maxSelections?: number | null | undefined;
    },
  ) {
    const [updated] = await db
      .update(modifierGroups)
      .set(compact({ ...data, updatedAt: new Date() }))
      .where(
        and(
          eq(modifierGroups.id, groupId),
          eq(modifierGroups.tenantId, tenantId),
        ),
      )
      .returning();
    return updated;
  },

  async deleteModifierGroup(tenantId: string, groupId: string) {
    await db
      .delete(modifierGroups)
      .where(
        and(
          eq(modifierGroups.id, groupId),
          eq(modifierGroups.tenantId, tenantId),
        ),
      );
  },

  // Full replace of a group's options — same "form sends the whole set" pattern.
  async setModifierGroupOptions(
    groupId: string,
    options: Array<{
      id?: string | undefined;
      name: string;
      additionalPrice: string;
      isAvailable?: boolean | undefined;
      maxQuantity?: number | undefined;
    }>,
  ) {
    await db
      .delete(modifierOptions)
      .where(eq(modifierOptions.modifierGroupId, groupId));
    if (options.length) {
      await db.insert(modifierOptions).values(
        options.map((o, i) => ({
          modifierGroupId: groupId,
          name: o.name,
          additionalPrice: o.additionalPrice,
          isAvailable: o.isAvailable ?? true,
          maxQuantity: o.maxQuantity ?? 1,
          sortOrder: i,
        })),
      );
    }
  },

  async findModifierOption(tenantId: string, optionId: string) {
    const option = await db.query.modifierOptions.findFirst({
      where: eq(modifierOptions.id, optionId),
      with: { group: true },
    });
    if (!option || option.group.tenantId !== tenantId) return null;
    return { id: option.id, branchId: option.group.branchId };
  },

  async setOptionAvailability(
    tenantId: string,
    optionId: string,
    isAvailable: boolean,
  ) {
    // Scope through the group's tenantId since options don't carry one directly.
    const option = await db.query.modifierOptions.findFirst({
      where: eq(modifierOptions.id, optionId),
      with: { group: true },
    });
    if (!option || option.group.tenantId !== tenantId) return null;
    const [updated] = await db
      .update(modifierOptions)
      .set({ isAvailable })
      .where(eq(modifierOptions.id, optionId))
      .returning();
    return updated;
  },

  // ─── Tags ──────────────────────────────────────────────────────────────────

  async findTags(tenantId: string) {
    return db.query.menuTags.findMany({
      where: eq(menuTags.tenantId, tenantId),
      orderBy: asc(menuTags.name),
    });
  },

  async createTag(tenantId: string, name: string, color?: string) {
    const [tag] = await db
      .insert(menuTags)
      .values({ tenantId, name, color: color ?? null })
      .returning();
    return tag!;
  },

  async deleteTag(tenantId: string, tagId: string) {
    await db
      .delete(menuTags)
      .where(and(eq(menuTags.id, tagId), eq(menuTags.tenantId, tenantId)));
  },

  // ─── Allergens (fixed, seeded list) ────────────────────────────────────────

  async findAllergens() {
    return db.query.menuAllergens.findMany({
      orderBy: asc(menuAllergens.name),
    });
  },
};
