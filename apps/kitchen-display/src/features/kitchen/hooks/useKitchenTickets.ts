import { useQuery } from "@tanstack/react-query";
import {
  fetchKitchenStations,
  fetchKitchenTickets,
} from "@/features/kitchen/api/tickets";
import {
  KITCHEN_STATIONS_QUERY_KEY,
  TICKETS_POLL_INTERVAL_MS,
} from "@/features/kitchen/constants";

export const kitchenTicketsQueryKey = (stationId?: string) =>
  ["kitchen-tickets", stationId ?? "all"] as const;
export const KITCHEN_TICKETS_QUERY_KEY = kitchenTicketsQueryKey();

export const useKitchenTickets = (stationId?: string) => {
  return useQuery({
    queryKey: kitchenTicketsQueryKey(stationId),
    queryFn: () => fetchKitchenTickets(stationId),
    refetchInterval: TICKETS_POLL_INTERVAL_MS,
  });
};

export const useKitchenStations = () => {
  return useQuery({
    queryKey: KITCHEN_STATIONS_QUERY_KEY,
    queryFn: fetchKitchenStations,
  });
};
