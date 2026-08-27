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

export const auditService = {
  async list(limit = 50): Promise<AuditEntry[]> {
    const response = await apiClient.get<{ success: boolean; data: AuditEntry[] }>("/audit", { params: { limit } });
    return response.data.data;
  },
};
