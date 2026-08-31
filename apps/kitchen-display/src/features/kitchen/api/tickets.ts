import { createKitchenApi } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";

const kitchenApi = createKitchenApi(apiClient);
import type { KitchenStation, KitchenTicket, KitchenTicketStatus } from "@pos/types";

export async function fetchKitchenTickets(stationId?: string): Promise<KitchenTicket[]> {
  return kitchenApi.tickets(stationId);
}

export async function fetchKitchenStations(): Promise<KitchenStation[]> {
  return kitchenApi.stations();
}

export async function updateTicketStatus(id: string, status: KitchenTicketStatus): Promise<void> {
  await kitchenApi.updateTicketStatus(id, status);
}
