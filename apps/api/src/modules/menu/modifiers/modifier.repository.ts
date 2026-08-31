
import { eq, and, isNull, or, asc, inArray } from "drizzle-orm";
import { db } from "../../../db";
import { ValidationError } from "../../../core/errors";
import {
  modifierGroups,
  modifierOptions,
  modifierOptionVariantPrices,
  menuItemVariants,
  menuItems,
  menuItemModifierGroups,
  menuTags,
  menuAllergens,
} from "../../../db/schema";
import { compact } from "../../../lib/object-utils";
import { withEffectiveModifierAvailability } from "../availability/availability-view";

export const modifierRepository = {

  async findModifierGroups(tenantId: string, branchId?: string) {
    const groups = await db.query.modifierGroups.findMany({
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
      with: { options: { orderBy: (t, { asc }) => [asc(t.sortOrder)], with: { variantPrices: true } } },
    });
    return groups.map((group) => ({
      ...group,
      options: group.options.map(withEffectiveModifierAvailability),
    }));
  },

  async findModifierGroup(tenantId: string, groupId: string) {
    return db.query.modifierGroups.findFirst({
      where: and(
        eq(modifierGroups.id, groupId),
        eq(modifierGroups.tenantId, tenantId),
      ),
      columns: { id: true, branchId: true, dependsOnOptionId: true, groupType: true },
    });
  },

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
          (row) => row.branchId === null || row.branchId === branchId,
        )
        .map((row) => row.id),
    );
  },

  async findOwnedTagIds(tenantId: string, tagIds: string[]) {
    if (!tagIds.length) return new Set<string>();
    const rows = await db.query.menuTags.findMany({
      where: and(eq(menuTags.tenantId, tenantId), inArray(menuTags.id, tagIds)),
      columns: { id: true },
    });
    return new Set(rows.map((row) => row.id));
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
          variantPrices?: Array<{ variantId: string; additionalPrice: string }> | undefined;
        }>
      | undefined;
    dependsOnOptionId?: string | null | undefined;
    groupType?: "ADDON" | "SUBSTITUTION" | undefined;
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
          dependsOnOptionId: data.dependsOnOptionId ?? null,
          groupType: data.groupType ?? "ADDON",
        })
        .returning();

      if (data.options?.length) {
        for (const [sortOrder, raw] of data.options.entries()) {
          const { variantPrices, ...option } = raw;
          const [createdOption] = await tx.insert(modifierOptions).values(
            compact({ modifierGroupId: group!.id, sortOrder, ...option }) as typeof modifierOptions.$inferInsert,
          ).returning({ id: modifierOptions.id });
          if (variantPrices?.length && createdOption) {
            await tx.insert(modifierOptionVariantPrices).values(variantPrices.map((price) => ({
              modifierOptionId: createdOption.id, variantId: price.variantId, additionalPrice: price.additionalPrice,
            })));
          }
        }
      }

      const created = await tx.query.modifierGroups.findFirst({
        where: eq(modifierGroups.id, group!.id),
        with: { options: true },
      });
      return created
        ? { ...created, options: created.options.map(withEffectiveModifierAvailability) }
        : undefined;
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
      dependsOnOptionId?: string | null | undefined;
      groupType?: "ADDON" | "SUBSTITUTION" | undefined;
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

  async setModifierGroupOptions(
    groupId: string,
    options: Array<{
      id?: string | undefined;
      name: string;
      additionalPrice: string;
      isAvailable?: boolean | undefined;
      maxQuantity?: number | undefined;
      isDefault?: boolean | undefined;
      replacesDefaultComponent?: string | undefined;
      variantPrices?: Array<{ variantId: string; additionalPrice: string }> | undefined;
    }>,
  ) {
    await db.transaction(async (tx) => {
      const existing = await tx.query.modifierOptions.findMany({
        where: eq(modifierOptions.modifierGroupId, groupId),
      });
      const existingById = new Map(existing.map((option) => [option.id, option]));
      const retainedIds = new Set(options.flatMap((option) => option.id ? [option.id] : []));

      for (const id of retainedIds) {
        if (!existingById.has(id)) {
          throw new ValidationError(`Modifier option ${id} does not belong to group ${groupId}`);
        }
      }

      const removedIds = existing
        .map((option) => option.id)
        .filter((id) => !retainedIds.has(id));
      if (removedIds.length) {
        await tx.delete(modifierOptions).where(inArray(modifierOptions.id, removedIds));
      }

      for (const [sortOrder, option] of options.entries()) {
        const variantPrices = option.variantPrices;
        if (option.id) {
          const previous = existingById.get(option.id)!;
          const availabilityPatch = option.isAvailable === undefined
            ? {}
            : option.isAvailable
              ? { manualOverrideAvailability: null }
              : { manualOverrideAvailability: false };
          await tx
            .update(modifierOptions)
            .set({
              name: option.name,
              additionalPrice: option.additionalPrice,
              maxQuantity: option.maxQuantity ?? previous.maxQuantity,
              isDefault: option.isDefault ?? previous.isDefault,
              replacesDefaultComponent:
                option.replacesDefaultComponent === undefined
                  ? previous.replacesDefaultComponent
                  : option.replacesDefaultComponent || null,
              sortOrder,
              ...availabilityPatch,
            })
            .where(eq(modifierOptions.id, option.id));
          if (variantPrices !== undefined) {
            await tx.delete(modifierOptionVariantPrices).where(eq(modifierOptionVariantPrices.modifierOptionId, option.id));
            if (variantPrices.length) await tx.insert(modifierOptionVariantPrices).values(variantPrices.map((price) => ({ modifierOptionId: option.id!, variantId: price.variantId, additionalPrice: price.additionalPrice })));
          }
          continue;
        }

        const [createdOption] = await tx.insert(modifierOptions).values({
          modifierGroupId: groupId,
          name: option.name,
          additionalPrice: option.additionalPrice,
          computedAvailability: true,
          manualOverrideAvailability: option.isAvailable === false ? false : null,
          maxQuantity: option.maxQuantity ?? 1,
          isDefault: option.isDefault ?? false,
          replacesDefaultComponent: option.replacesDefaultComponent || null,
          sortOrder,
        }).returning({ id: modifierOptions.id });
        if (createdOption && variantPrices?.length) await tx.insert(modifierOptionVariantPrices).values(variantPrices.map((price) => ({ modifierOptionId: createdOption.id, variantId: price.variantId, additionalPrice: price.additionalPrice })));
      }
    });
  },

  async findEligibleVariantIdsForGroup(
    tenantId: string,
    groupId: string,
    variantIds: string[],
  ) {
    if (!variantIds.length) return new Set<string>();
    const rows = await db
      .select({ id: menuItemVariants.id })
      .from(menuItemVariants)
      .innerJoin(menuItems, eq(menuItemVariants.menuItemId, menuItems.id))
      .innerJoin(
        menuItemModifierGroups,
        and(
          eq(menuItemModifierGroups.menuItemId, menuItems.id),
          eq(menuItemModifierGroups.modifierGroupId, groupId),
        ),
      )
      .where(
        and(
          eq(menuItems.tenantId, tenantId),
          inArray(menuItemVariants.id, variantIds),
        ),
      );
    return new Set(rows.map((row) => row.id));
  },

  async findModifierOption(tenantId: string, optionId: string) {
    const option = await db.query.modifierOptions.findFirst({
      where: eq(modifierOptions.id, optionId),
      with: { group: true },
    });
    if (!option || option.group.tenantId !== tenantId) return null;
    return { id: option.id, branchId: option.group.branchId, modifierGroupId: option.modifierGroupId };
  },

  async setOptionAvailability(
    tenantId: string,
    optionId: string,
    isAvailable: boolean,
  ) {

    const option = await db.query.modifierOptions.findFirst({
      where: eq(modifierOptions.id, optionId),
      with: { group: true },
    });
    if (!option || option.group.tenantId !== tenantId) return null;

    const manualOverrideAvailability = isAvailable ? null : false;
    const effectiveAvailability = isAvailable
      ? option.computedAvailability
      : false;
    const [updated] = await db
      .update(modifierOptions)
      .set({
        manualOverrideAvailability,
      })
      .where(eq(modifierOptions.id, optionId))
      .returning();
    return updated
      ? { ...withEffectiveModifierAvailability(updated), isAvailable: effectiveAvailability }
      : undefined;
  },

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

  async findAllergens() {
    return db.query.menuAllergens.findMany({
      orderBy: asc(menuAllergens.name),
    });
  },
};
