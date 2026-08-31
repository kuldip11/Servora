import type { TableStatus } from "@pos/types";
import { getDomainData, patchDomainData, postDomainData, type DomainHttpClient } from "./shared";

export interface RestaurantTableDto {
  id: string;
  branchId: string;
  name: string;
  capacity: number;
  section: string | null;
  status: TableStatus;
  isActive: boolean;
  publicQrToken: string;
  branch?: { id: string; name: string };
}

export interface TakeawayQrDto {
  branchId: string;
  branchName: string;
  enabled: boolean;
  token: string;
}

export interface TableInput {
  name: string;
  capacity?: number;
  section?: string;
  branchId?: string;
}

export function createTablesApi(client: DomainHttpClient) {
  return {
    list(): Promise<RestaurantTableDto[]> {
      return getDomainData<RestaurantTableDto[]>(client, "/tables");
    },
    create(input: TableInput): Promise<RestaurantTableDto> {
      return postDomainData<RestaurantTableDto>(client, "/tables", input);
    },
    update(id: string, input: Omit<TableInput, "branchId">): Promise<RestaurantTableDto> {
      return patchDomainData<RestaurantTableDto>(client, `/tables/${id}`, input);
    },
    updateStatus(id: string, status: string): Promise<RestaurantTableDto> {
      return patchDomainData<RestaurantTableDto>(client, `/tables/${id}/status`, { status });
    },
    remove(id: string): Promise<void> {
      return client.delete(`/tables/${id}`).then(() => undefined);
    },
    regenerateQr(id: string): Promise<RestaurantTableDto> {
      return postDomainData<RestaurantTableDto>(client, `/tables/${id}/qr/regenerate`);
    },
    getTakeawayQr(branchId: string): Promise<TakeawayQrDto> {
      return getDomainData<TakeawayQrDto>(client, `/branches/${branchId}/takeaway-qr`);
    },
    regenerateTakeawayQr(branchId: string): Promise<TakeawayQrDto> {
      return postDomainData<TakeawayQrDto>(client, `/branches/${branchId}/takeaway-qr/regenerate`);
    },
  };
}
