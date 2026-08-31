import { useQuery } from "@tanstack/react-query";
import { fetchKitchenStations, fetchKitchenTickets } from "../api/tickets";
import { TICKETS_POLL_INTERVAL_MS } from "../constants";

export const kitchenTicketsQueryKey = (stationId?: string) => ["kitchen-tickets", stationId ?? "all"] as const;
export const KITCHEN_TICKETS_QUERY_KEY = kitchenTicketsQueryKey();
export const KITCHEN_STATIONS_QUERY_KEY = ["kitchen-stations"] as const;

export function useKitchenTickets(stationId?: string) {
  return useQuery({
    queryKey: kitchenTicketsQueryKey(stationId),
    queryFn: () => fetchKitchenTickets(stationId),
    refetchInterval: TICKETS_POLL_INTERVAL_MS,
  });
}

export function useKitchenStations() {
  return useQuery({ queryKey: KITCHEN_STATIONS_QUERY_KEY, queryFn: fetchKitchenStations });
}
