import { useQuery } from "@tanstack/react-query";
import { fetchKitchenTickets } from "../api/tickets";
import { TICKETS_POLL_INTERVAL_MS } from "../constants";

export const KITCHEN_TICKETS_QUERY_KEY = ["kitchen-tickets"] as const;

export function useKitchenTickets() {
  return useQuery({
    queryKey: KITCHEN_TICKETS_QUERY_KEY,
    queryFn: fetchKitchenTickets,
    refetchInterval: TICKETS_POLL_INTERVAL_MS,
  });
}
