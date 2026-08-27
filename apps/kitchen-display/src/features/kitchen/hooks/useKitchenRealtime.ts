import { useQueryClient } from "@tanstack/react-query";
import type { KitchenTicket } from "@pos/types";
import {
  useRealtimeEvent,
  useConnectionStatus,
} from "../../../shared/lib/realtime";
import { KITCHEN_TICKETS_QUERY_KEY } from "./useKitchenTickets";

function isVisible(ticket: KitchenTicket) {
  return (
    ticket.status === "FIRED" ||
    ticket.status === "PREPARING" ||
    ticket.status === "READY"
  );
}

export function useKitchenRealtime(): { connected: boolean } {
  const qc = useQueryClient();
  const connected = useConnectionStatus();

  const upsert = (ticket: KitchenTicket) => {
    qc.setQueryData<KitchenTicket[]>(KITCHEN_TICKETS_QUERY_KEY, (current) => {
      if (!current) return isVisible(ticket) ? [ticket] : current;
      const without = current.filter((item) => item.id !== ticket.id);
      if (!isVisible(ticket)) return without;
      return [...without, ticket].sort(
        (a, b) => new Date(a.firedAt).getTime() - new Date(b.firedAt).getTime(),
      );
    });
  };

  useRealtimeEvent("kitchen.ticket.created", (event) => upsert(event.payload));
  useRealtimeEvent("kitchen.ticket.updated", (event) => upsert(event.payload));

  return { connected };
}
