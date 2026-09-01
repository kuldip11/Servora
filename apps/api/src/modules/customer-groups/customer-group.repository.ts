import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { customerGroups } from "@/db/schema";

export const customerGroupRepository = {
  list(tenantId: string) {
    return db.query.customerGroups.findMany({
      where: eq(customerGroups.tenantId, tenantId),
      orderBy: (t, { asc }) => [asc(t.name)],
    });
  },
  findById(tenantId: string, id: string) {
    return db.query.customerGroups.findFirst({
      where: and(
        eq(customerGroups.tenantId, tenantId),
        eq(customerGroups.id, id),
      ),
    });
  },
  async create(data: {
    tenantId: string;
    name: string;
    discountPercent?: number | null;
    discountFixed?: number | null;
  }) {
    const [row] = await db
      .insert(customerGroups)
      .values({
        tenantId: data.tenantId,
        name: data.name,
        discountPercent:
          data.discountPercent == null ? null : String(data.discountPercent),
        discountFixed:
          data.discountFixed == null ? null : String(data.discountFixed),
      })
      .returning();
    return row!;
  },
  async update(
    tenantId: string,
    id: string,
    data: {
      name?: string;
      discountPercent?: number | null;
      discountFixed?: number | null;
    },
  ) {
    const [row] = await db
      .update(customerGroups)
      .set({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.discountPercent !== undefined
          ? {
              discountPercent:
                data.discountPercent == null
                  ? null
                  : String(data.discountPercent),
            }
          : {}),
        ...(data.discountFixed !== undefined
          ? {
              discountFixed:
                data.discountFixed == null ? null : String(data.discountFixed),
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(
        and(eq(customerGroups.tenantId, tenantId), eq(customerGroups.id, id)),
      )
      .returning();
    return row;
  },
  async remove(tenantId: string, id: string) {
    const [row] = await db
      .delete(customerGroups)
      .where(
        and(eq(customerGroups.tenantId, tenantId), eq(customerGroups.id, id)),
      )
      .returning({ id: customerGroups.id });
    return row;
  },
};
