import { createKitchenApi } from "@pos/api-client";
import { apiClient } from "@/shared/lib/api-client";

const kitchenApi = createKitchenApi(apiClient);
import type {
  KitchenStation,
  KitchenTicket,
  KitchenTicketStatus,
} from "@pos/types";

export const fetchKitchenTickets = async (
  stationId?: string,
): Promise<KitchenTicket[]> => {
  return kitchenApi.tickets(stationId);
};

export const fetchKitchenStations = async (): Promise<KitchenStation[]> => {
  return kitchenApi.stations();
};

export const updateTicketStatus = async (
  id: string,
  status: KitchenTicketStatus,
): Promise<void> => {
  await kitchenApi.updateTicketStatus(id, status);
};
