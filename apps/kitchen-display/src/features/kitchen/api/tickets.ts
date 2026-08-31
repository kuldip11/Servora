import { apiClient } from "../../../shared/lib/api-client";
import type { KitchenStation, KitchenTicket, KitchenTicketStatus } from "@pos/types";

export async function fetchKitchenTickets(stationId?: string): Promise<KitchenTicket[]> {
  const res = stationId
    ? await apiClient.get("/kitchen-tickets", { params: { stationId } })
    : await apiClient.get("/kitchen-tickets");
  return res.data.data;
}

export async function fetchKitchenStations(): Promise<KitchenStation[]> {
  const res = await apiClient.get("/kitchen-tickets/stations");
  return res.data.data;
}

export async function updateTicketStatus(id: string, status: KitchenTicketStatus): Promise<void> {
  await apiClient.patch(`/kitchen-tickets/${id}/status`, { status });
}
