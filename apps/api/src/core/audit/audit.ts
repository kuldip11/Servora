import { db } from "../../db";
import { auditLogs } from "../../db/schema";

export type AuditAction =
  | "TENANT_CREATED"
  | "TENANT_ARCHIVED"
  | "TENANT_UPDATED"
  | "BRANCH_CREATED"
  | "BRANCH_UPDATED"
  | "BRANCH_ARCHIVED"
  | "BRANCH_TAKEAWAY_QR_REGENERATED"
  | "STAFF_CREATED"
  | "STAFF_DEACTIVATED"
  | "STAFF_REACTIVATED"
  | "STAFF_ROLE_ASSIGNED"
  | "STAFF_BRANCHES_ASSIGNED"
  | "ROLE_CREATED"
  | "ROLE_UPDATED"
  | "ROLE_ARCHIVED"
  | "ROLE_PERMISSIONS_UPDATED"
  | "PAYMENT_CREATED"
  | "BILL_SPLIT"
  | "REFUND_CREATED"
  | "MENU_AVAILABILITY_OVERRIDE_SET"
  | "MENU_AVAILABILITY_OVERRIDE_CLEARED"
  | "MENU_AVAILABILITY_COMPUTED_CHANGED"
  | "KITCHEN_COURSE_MANUALLY_FIRED"
  | "KITCHEN_COURSE_AUTO_FIRED"
  | "ORDER_ITEM_REFIRED"
  | "ORDER_ITEM_REFILL"
  | "ORGANIZATION_MENU_CREATED"
  | "ORGANIZATION_MENU_UPDATED"
  | "ORGANIZATION_MENU_DELETED"
  | "MENU_STOCK_COUNT_ADJUSTED"
  | "ORDER_ITEM_SEAT_SHARES_UPDATED"
  | "CUSTOMER_GROUP_CREATED"
  | "CUSTOMER_GROUP_UPDATED"
  | "CUSTOMER_GROUP_DELETED"
  | "LOYALTY_TIER_CREATED"
  | "LOYALTY_TIER_UPDATED"
  | "LOYALTY_TIER_DELETED"
  | "CUSTOMER_CREATED"
  | "CUSTOMER_LOYALTY_UPDATED"
  | "VOID_COMP_THRESHOLD_UPDATED"
  | "MANAGER_APPROVAL_GRANTED"
  | "ORGANIZATION_LOYALTY_TIER_CREATED"
  | "ORGANIZATION_LOYALTY_TIER_UPDATED"
  | "ORGANIZATION_LOYALTY_TIER_DELETED"
  | "COMBO_CREATED"
  | "COMBO_DELETED";

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
  const metadataBranchId =
    typeof input.metadata?.branchId === "string"
      ? input.metadata.branchId
      : null;
  const [entry] = await db
    .insert(auditLogs)
    .values({
      tenantId: input.tenantId,
      userId: input.userId ?? null,
      branchId: input.branchId ?? metadataBranchId,
      requestId: input.requestId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      metadata: JSON.stringify(input.metadata ?? {}),
      ipAddress: input.ipAddress ?? null,
    })
    .returning();
  return entry!;
}
