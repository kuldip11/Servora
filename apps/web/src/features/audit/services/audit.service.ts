import { createAuditApi } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";

const auditApi = createAuditApi(apiClient);

export interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: string | null;
  createdAt: string;
  userId: string | null;
  userName: string | null;
}

export interface MenuHistoryEntry {
  id: string;
  entityType: string;
  entityId: string;
  changeType: string;
  diff: Record<string, unknown>;
  changedBy: string | null;
  changedAt: string;
}

export const auditService = {
  async list(limit = 50): Promise<AuditEntry[]> {
    return auditApi.list<AuditEntry[]>({ limit });
  },
  async menuHistory(filters: {
    entityType?: string;
    changeType?: string;
    entityId?: string;
    limit?: number;
  } = {}): Promise<MenuHistoryEntry[]> {
    return auditApi.menuHistory<MenuHistoryEntry[]>(filters);
  },
};
