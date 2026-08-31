import { apiClient } from "../../../shared/lib/api-client";

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
    const response = await apiClient.get<{
      success: boolean;
      data: AuditEntry[];
    }>("/audit", { params: { limit } });
    return response.data.data;
  },
  async menuHistory(filters: {
    entityType?: string;
    changeType?: string;
    entityId?: string;
    limit?: number;
  } = {}): Promise<MenuHistoryEntry[]> {
    const response = await apiClient.get<{ success: boolean; data: MenuHistoryEntry[] }>(
      "/menu/history",
      { params: filters },
    );
    return response.data.data;
  },
};
