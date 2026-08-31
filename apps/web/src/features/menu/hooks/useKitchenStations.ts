import { useMutation, useQuery } from "@tanstack/react-query";
import { kitchenStationsService } from "../services/kitchen-stations.service";
import { queryClient } from "../../../shared/lib/query-client";

export const useKitchenStations = () => useQuery({ queryKey: ["kitchen-stations"], queryFn: kitchenStationsService.list });
export const useItemStationRoutes = (itemId: string) => useQuery({
  queryKey: ["kitchen-stations", "routes", itemId], queryFn: () => kitchenStationsService.routes(itemId), enabled: !!itemId,
});
export function useCreateKitchenStation() {
  return useMutation({ mutationFn: kitchenStationsService.create, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kitchen-stations"] }) });
}
export function useDeleteKitchenStation() {
  return useMutation({ mutationFn: kitchenStationsService.remove, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kitchen-stations"] }) });
}
export function useSetItemStationRoute(itemId: string) {
  return useMutation({
    mutationFn: async (input: { stationId: string | null; modifierOptionId?: string | null }) => {
      if (input.stationId) await kitchenStationsService.setRoute(itemId, input.stationId, input.modifierOptionId);
      else await kitchenStationsService.removeRoute(itemId, input.modifierOptionId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kitchen-stations", "routes", itemId] }),
  });
}
