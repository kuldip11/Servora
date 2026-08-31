import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  itemStationRouting,
  kitchenStations,
  menuItems,
  modifierGroups,
  modifierOptions,
  menuItemModifierGroups,
} from "@/db/schema";

export const stationRepository = {
  list(tenantId: string, branchId?: string) {
    return db.query.kitchenStations.findMany({
      where: and(
        eq(kitchenStations.tenantId, tenantId),
        branchId ? eq(kitchenStations.branchId, branchId) : undefined,
      ),
      orderBy: [asc(kitchenStations.sortOrder), asc(kitchenStations.name)],
    });
  },
  findById(tenantId: string, id: string) {
    return db.query.kitchenStations.findFirst({
      where: and(
        eq(kitchenStations.tenantId, tenantId),
        eq(kitchenStations.id, id),
      ),
    });
  },
  async create(values: typeof kitchenStations.$inferInsert) {
    const [row] = await db.insert(kitchenStations).values(values).returning();
    return row;
  },
  async update(
    tenantId: string,
    id: string,
    patch: Partial<typeof kitchenStations.$inferInsert>,
  ) {
    const [row] = await db
      .update(kitchenStations)
      .set({ ...patch, updatedAt: new Date() })
      .where(
        and(eq(kitchenStations.tenantId, tenantId), eq(kitchenStations.id, id)),
      )
      .returning();
    return row;
  },
  async remove(tenantId: string, id: string) {
    const [row] = await db
      .delete(kitchenStations)
      .where(
        and(eq(kitchenStations.tenantId, tenantId), eq(kitchenStations.id, id)),
      )
      .returning();
    return row;
  },
  async findRoutingResources(
    tenantId: string,
    menuItemId: string,
    stationId: string,
    modifierOptionId?: string | null,
  ) {
    const [item, station, modifier] = await Promise.all([
      db.query.menuItems.findFirst({
        where: and(
          eq(menuItems.tenantId, tenantId),
          eq(menuItems.id, menuItemId),
        ),
      }),
      this.findById(tenantId, stationId),
      modifierOptionId
        ? db
            .select({
              id: modifierOptions.id,
              tenantId: modifierGroups.tenantId,
            })
            .from(modifierOptions)
            .innerJoin(
              modifierGroups,
              eq(modifierGroups.id, modifierOptions.modifierGroupId),
            )
            .innerJoin(
              menuItemModifierGroups,
              and(
                eq(menuItemModifierGroups.modifierGroupId, modifierGroups.id),
                eq(menuItemModifierGroups.menuItemId, menuItemId),
              ),
            )
            .where(
              and(
                eq(modifierOptions.id, modifierOptionId),
                eq(modifierGroups.tenantId, tenantId),
              ),
            )
            .then((rows) => rows[0])
        : null,
    ]);
    return { item, station, modifier };
  },
  async setRoute(
    menuItemId: string,
    stationId: string,
    modifierOptionId?: string | null,
  ) {
    return db.transaction(async (tx) => {
      await tx
        .delete(itemStationRouting)
        .where(
          and(
            eq(itemStationRouting.menuItemId, menuItemId),
            modifierOptionId
              ? eq(itemStationRouting.modifierOptionId, modifierOptionId)
              : isNull(itemStationRouting.modifierOptionId),
          ),
        );
      const [row] = await tx
        .insert(itemStationRouting)
        .values({
          menuItemId,
          stationId,
          modifierOptionId: modifierOptionId ?? null,
        })
        .returning();
      return row;
    });
  },
  async removeRoute(
    tenantId: string,
    menuItemId: string,
    modifierOptionId?: string | null,
  ) {
    const stationIds = db
      .select({ id: kitchenStations.id })
      .from(kitchenStations)
      .where(eq(kitchenStations.tenantId, tenantId));
    const [row] = await db
      .delete(itemStationRouting)
      .where(
        and(
          eq(itemStationRouting.menuItemId, menuItemId),
          inArray(itemStationRouting.stationId, stationIds),
          modifierOptionId
            ? eq(itemStationRouting.modifierOptionId, modifierOptionId)
            : isNull(itemStationRouting.modifierOptionId),
        ),
      )
      .returning();
    return row;
  },
  listRoutes(tenantId: string, menuItemId: string) {
    const stationIds = db
      .select({ id: kitchenStations.id })
      .from(kitchenStations)
      .where(eq(kitchenStations.tenantId, tenantId));
    return db.query.itemStationRouting.findMany({
      where: and(
        eq(itemStationRouting.menuItemId, menuItemId),
        inArray(itemStationRouting.stationId, stationIds),
      ),
    });
  },
};
