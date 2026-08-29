import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { organizationMemberships, organizations } from "../../db/schema";

export const organizationRepository = {
  async findMembershipsByUserId(userId: string) {
    return db.query.organizationMemberships.findMany({
      where: and(
        eq(organizationMemberships.userId, userId),
        eq(organizationMemberships.status, "ACTIVE"),
      ),
      with: { organization: true },
      orderBy: (membership, { asc }) => asc(membership.createdAt),
    });
  },

  async findMembership(userId: string, organizationId: string) {
    return db.query.organizationMemberships.findFirst({
      where: and(
        eq(organizationMemberships.userId, userId),
        eq(organizationMemberships.organizationId, organizationId),
        eq(organizationMemberships.status, "ACTIVE"),
      ),
      with: { organization: true },
    });
  },

  async create(data: { name: string; createdBy: string }) {
    return db.transaction(async (tx) => {
      const [organization] = await tx
        .insert(organizations)
        .values(data)
        .returning();
      if (!organization) throw new Error("Organization creation failed");
      const [membership] = await tx
        .insert(organizationMemberships)
        .values({ userId: data.createdBy, organizationId: organization.id })
        .returning();
      if (!membership)
        throw new Error("Organization membership creation failed");
      return { organization, membership };
    });
  },

  async update(id: string, changes: { name?: string; isActive?: boolean }) {
    const [organization] = await db
      .update(organizations)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return organization;
  },
};
