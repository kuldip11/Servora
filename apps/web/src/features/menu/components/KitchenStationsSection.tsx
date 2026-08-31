import { useState } from "react";
import { Button, Input } from "@pos/ui";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import {
  useCreateKitchenStation,
  useDeleteKitchenStation,
  useKitchenStations,
} from "@/features/menu/hooks/useKitchenStations";
import { appUrls } from "@/config/app-urls";

export const KitchenStationsSection = () => {
  const [name, setName] = useState("");
  const { data = [], isLoading } = useKitchenStations();
  const create = useCreateKitchenStation();
  const remove = useDeleteKitchenStation();
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-text-primary">
          Kitchen stations
        </h2>
        <p className="mt-0.5 text-sm text-text-secondary">
          Create branch stations, then route each item or modifier from the item
          editor.
        </p>
      </div>
      <form
        className="flex max-w-md items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = name.trim();
          if (value)
            create.mutate({ name: value }, { onSuccess: () => setName("") });
        }}
      >
        <Input
          label="New station"
          placeholder="Grill"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button type="submit" loading={create.isPending}>
          <Plus className="h-4 w-4" /> Create
        </Button>
      </form>
      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading stations…</p>
      ) : !data.length ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-text-secondary">
          No stations configured. Orders remain in the undifferentiated kitchen
          flow.
        </p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {data.map((station) => (
            <div key={station.id} className="flex items-center gap-3 p-4">
              <div className="flex-1">
                <p className="font-medium text-text-primary">{station.name}</p>
                <p className="text-xs text-text-secondary">
                  {station.printerIdentifier ?? "No printer assigned"}
                </p>
              </div>
              <a
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:underline"
                href={`${appUrls.kitchen}?stationId=${station.id}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open KDS
              </a>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Delete ${station.name}`}
                onClick={() => remove.mutate(station.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
