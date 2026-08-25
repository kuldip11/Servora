import { apiClient } from "../../../shared/lib/api-client";
import type { KitchenTicket, KitchenTicketStatus } from "@pos/types";

export async function fetchKitchenTickets(): Promise<KitchenTicket[]> {
  const res = await apiClient.get("/kitchen-tickets");
  return res.data.data;
}

export async function updateTicketStatus(
  id: string,
  status: KitchenTicketStatus,
): Promise<void> {
  await apiClient.patch(`/kitchen-tickets/${id}/status`, { status });
}
