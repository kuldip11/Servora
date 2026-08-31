import type { CancellationReason } from "@pos/types";
import { createOrdersApi } from "@pos/api-client";
import { apiClient } from "@/shared/lib/api-client";

const ordersApi = createOrdersApi(apiClient);

export const cancellationReasonsService = {
  async list(activeOnly = true): Promise<CancellationReason[]> {
    return activeOnly
      ? ordersApi.listCancellationReasons()
      : ordersApi.listAllCancellationReasons();
  },
  async listAll(): Promise<CancellationReason[]> {
    return ordersApi.listAllCancellationReasons();
  },
  async create(label: string): Promise<CancellationReason> {
    return ordersApi.createCancellationReason(label);
  },
  async update(
    id: string,
    patch: { label?: string; isActive?: boolean },
  ): Promise<CancellationReason> {
    return ordersApi.updateCancellationReason(id, patch);
  },
};
