import type { ModifierGroup } from "@pos/types";
import { useItemStationRoutes, useKitchenStations, useSetItemStationRoute } from "../../hooks/useKitchenStations";

export function StationRoutingEditor({ itemId, groups }: { itemId: string; groups: ModifierGroup[] }) {
  const { data: stations = [] } = useKitchenStations();
  const { data: routes = [] } = useItemStationRoutes(itemId);
  const setRoute = useSetItemStationRoute(itemId);
  if (!stations.length) return null;

  const select = (label: string, modifierOptionId?: string) => {
    const route = routes.find((candidate) => candidate.modifierOptionId === (modifierOptionId ?? null));
    return <label className="grid gap-1 text-xs text-text-secondary" key={modifierOptionId ?? "default"}>
      {label}
      <select
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
        value={route?.stationId ?? ""}
        onChange={(event) => setRoute.mutate({
          stationId: event.target.value || null,
          ...(modifierOptionId ? { modifierOptionId } : {}),
        })}
      >
        <option value="">No station</option>
        {stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
      </select>
    </label>;
  };

  return <div className="space-y-3 border-t border-divider pt-4">
    <div><h3 className="text-sm font-semibold text-text-primary">Kitchen routing</h3><p className="text-xs text-text-secondary">A modifier route overrides the item’s default station.</p></div>
    {select("Default station")}
    <div className="grid gap-2 md:grid-cols-2">
      {groups.flatMap((group) => group.options.map((option) => select(`${group.name}: ${option.name}`, option.id)))}
    </div>
  </div>;
}
