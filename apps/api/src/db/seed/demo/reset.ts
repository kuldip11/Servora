import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { organizations, tenants, users } from "@/db/schema";
import { DEMO_EMAIL, DEMO_ORG_NAME } from "./utils";

export const resetDemoData = async (): Promise<void> => {
  if (process.env["NODE_ENV"] === "production") throw new Error("Demo seed/reset is disabled in production");

  const orgRows = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.name, DEMO_ORG_NAME));
  const orgIds = orgRows.map((row) => row.id);
  if (orgIds.length > 0) {
    const tenantRows = await db.select({ id: tenants.id }).from(tenants).where(inArray(tenants.organizationId, orgIds));
    if (tenantRows.length > 0) {
      try {
        await db.execute(sql`ALTER TABLE audit_logs DISABLE TRIGGER audit_logs_immutable_delete`);
        for (const tenant of tenantRows) await db.execute(sql`DELETE FROM audit_logs WHERE tenant_id = ${tenant.id}`);
      } finally {
        await db.execute(sql`ALTER TABLE audit_logs ENABLE TRIGGER audit_logs_immutable_delete`);
      }
      await db.delete(tenants).where(inArray(tenants.id, tenantRows.map((row) => row.id)));
    }
    await db.delete(organizations).where(inArray(organizations.id, orgIds));
  }
  await db.delete(users).where(eq(users.email, DEMO_EMAIL));
};
