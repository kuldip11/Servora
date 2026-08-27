import { db } from "../../db";
import { auditLogs } from "../../db/schema";

export type AuditAction =
  | "TENANT_CREATED"
  | "TENANT_ARCHIVED"
  | "TENANT_UPDATED"
  | "BRANCH_CREATED"
  | "BRANCH_UPDATED"
  | "BRANCH_ARCHIVED"
  | "STAFF_CREATED"
  | "STAFF_DEACTIVATED"
  | "STAFF_REACTIVATED"
  | "STAFF_ROLE_ASSIGNED"
  | "STAFF_BRANCHES_ASSIGNED"
  | "REFUND_CREATED"
  | "BRANCH_TAKEAWAY_QR_REGENERATED";

export interface AuditInput {
  tenantId: string;
  userId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

/**
 * Centralized tenant-scoped audit writer. Sensitive mutations call this only
 * after their authorization and state mutation have succeeded.
 * Metadata is JSON text for compatibility with the existing audit schema.
 */
export async function writeAudit(input: AuditInput) {
  const [entry] = await db
    .insert(auditLogs)
    .values({
      tenantId: input.tenantId,
      userId: input.userId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      metadata: JSON.stringify(input.metadata ?? {}),
      ipAddress: input.ipAddress ?? null,
    })
    .returning();
  return entry!;
}
