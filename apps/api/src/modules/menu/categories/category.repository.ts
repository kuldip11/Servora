/** Persistence operations for menu categories. */
import { eq, and, isNull, or } from "drizzle-orm";
import { db } from "../../../db";
import { menuCategories, menuItems } from "../../../db/schema";
import { ITEM_DETAIL_RELATIONS } from "../items/item.repository";
import { compact } from "../../../lib/object-utils";
import {
  withEffectiveMenuItemAvailability,
  withEffectiveModifierAvailability,
} from "../availability/availability-view";

export const categoryRepository = {
  async findById(tenantId: string, categoryId: string) {
    return db.query.menuCategories.findFirst({
      where: and(
        eq(menuCategories.id, categoryId),
        eq(menuCategories.tenantId, tenantId),
      ),
      columns: { id: true, branchId: true },
    });
  },

  async findMany(
    tenantId: string,
    branchId: string | null | undefined,
    includeUnpublished: boolean,
  ) {
    const categories = await db.query.menuCategories.findMany({
      where: and(
        eq(menuCategories.tenantId, tenantId),
        eq(menuCategories.isActive, true),
        // Show categories scoped to this branch, plus tenant-wide shared
        // ones (branchId is null). No branch selected (aggregate view) ->
        // show everything.
        branchId
          ? or(
              eq(menuCategories.branchId, branchId),
              isNull(menuCategories.branchId),
            )
          : undefined,
      ),
      orderBy: menuCategories.sortOrder,
      with: {
        menuItems: {
          where: and(
            isNull(menuItems.deletedAt),
            includeUnpublished ? undefined : eq(menuItems.isPublished, true),
            branchId
              ? or(eq(menuItems.branchId, branchId), isNull(menuItems.branchId))
              : undefined,
          ),
          orderBy: (t: any, { asc }: any) => [asc(t.sortOrder)],
          with: ITEM_DETAIL_RELATIONS,
        },
      },
    });
    return categories.map((category) => ({
      ...category,
      menuItems: category.menuItems.map((item) => ({
        ...withEffectiveMenuItemAvailability(item),
        modifierGroupLinks: item.modifierGroupLinks.map((link) => ({
          ...link,
          group: {
            ...link.group,
            options: link.group.options.map(withEffectiveModifierAvailability),
          },
        })),
      })),
    }));
  },

  async create(data: {
    tenantId: string;
    branchId?: string | undefined;
    name: string;
    description?: string | undefined;
    sortOrder?: number | undefined;
  }) {
    const [cat] = await db
      .insert(menuCategories)
      .values(compact(data) as typeof menuCategories.$inferInsert)
      .returning();
    return cat!;
  },

  async update(
    tenantId: string,
    categoryId: string,
    data: {
      name?: string | undefined;
      description?: string | undefined;
      sortOrder?: number | undefined;
      isActive?: boolean | undefined;
    },
  ) {
    const [updated] = await db
      .update(menuCategories)
      .set(compact({ ...data, updatedAt: new Date() }))
      .where(
        and(
          eq(menuCategories.id, categoryId),
          eq(menuCategories.tenantId, tenantId),
        ),
      )
      .returning();
    return updated;
  },

  async itemCount(tenantId: string, categoryId: string) {
    const items = await db.query.menuItems.findMany({
      where: and(
        eq(menuItems.categoryId, categoryId),
        eq(menuItems.tenantId, tenantId),
        isNull(menuItems.deletedAt),
      ),
      columns: { id: true },
    });
    return items.length;
  },
};
