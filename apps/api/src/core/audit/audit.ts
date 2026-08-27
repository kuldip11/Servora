import { db } from "../../db";
import { auditLogs } from "../../db/schema";

export type AuditAction =
  | "TENANT_CREATED" | "TENANT_ARCHIVED" | "TENANT_UPDATED"
  | "BRANCH_CREATED" | "BRANCH_UPDATED" | "BRANCH_ARCHIVED" | "BRANCH_TAKEAWAY_QR_REGENERATED"
  | "STAFF_CREATED" | "STAFF_DEACTIVATED" | "STAFF_REACTIVATED" | "STAFF_ROLE_ASSIGNED" | "STAFF_BRANCHES_ASSIGNED"
  | "ROLE_CREATED" | "ROLE_UPDATED" | "ROLE_ARCHIVED" | "ROLE_PERMISSIONS_UPDATED"
  | "PAYMENT_CREATED" | "REFUND_CREATED";

export interface AuditInput {
  tenantId: string;
  userId?: string | null | undefined;
  branchId?: string | null | undefined;
  requestId?: string | null | undefined;
  action: AuditAction;
  entity: string;
  entityId?: string | null | undefined;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null | undefined;
}

/** Append-only tenant-scoped security/operations audit writer. */
export async function writeAudit(input: AuditInput) {
  const metadataBranchId = typeof input.metadata?.branchId === "string" ? input.metadata.branchId : null;
  const [entry] = await db.insert(auditLogs).values({
    tenantId: input.tenantId,
    userId: input.userId ?? null,
    branchId: input.branchId ?? metadataBranchId,
    requestId: input.requestId ?? null,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? null,
    metadata: JSON.stringify(input.metadata ?? {}),
    ipAddress: input.ipAddress ?? null,
  }).returning();
  return entry!;
}
