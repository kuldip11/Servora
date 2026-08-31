import { voidDomainRequest } from "./shared";
import type { KitchenStation, KitchenTicket, KitchenTicketStatus } from "@pos/types";
import { getDomainData, type DomainHttpClient } from "./shared";

export function createKitchenApi(client: DomainHttpClient) {
  return {
    tickets(stationId?: string): Promise<KitchenTicket[]> {
      return getDomainData<KitchenTicket[]>(client, "/kitchen-tickets", stationId ? { params: { stationId } } : undefined);
    },
    stations(): Promise<KitchenStation[]> {
      return getDomainData<KitchenStation[]>(client, "/kitchen-tickets/stations");
    },
    updateTicketStatus(id: string, status: KitchenTicketStatus): Promise<void> {
      return voidDomainRequest(client.patch(`/kitchen-tickets/${id}/status`, { status }));
    },
  };
}
