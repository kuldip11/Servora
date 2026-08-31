import type { CancellationReason } from "@pos/types";
import { apiClient } from "../../../shared/lib/api-client";

export const cancellationReasonsService = {
  async list(activeOnly = true): Promise<CancellationReason[]> {
    const res = await apiClient.get("/orders/cancellation-reasons", {
      params: { activeOnly: String(activeOnly) },
    });
    return res.data.data;
  },
  async listAll(): Promise<CancellationReason[]> {
    const res = await apiClient.get("/orders/cancellation-reasons");
    return res.data.data;
  },
  async create(label: string): Promise<CancellationReason> {
    const res = await apiClient.post("/orders/cancellation-reasons", { label });
    return res.data.data;
  },
  async update(id: string, patch: { label?: string; isActive?: boolean }): Promise<CancellationReason> {
    const res = await apiClient.patch(`/orders/cancellation-reasons/${id}`, patch);
    return res.data.data;
  },
};
