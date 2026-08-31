import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Input } from "@pos/ui";
import { apiClient } from "../../../shared/lib/api-client";
import { queryClient } from "../../../shared/lib/query-client";

const TYPES = ["DINE_IN", "TAKEAWAY", "DELIVERY", "ONLINE"];

export function ChannelOverridesPanel({ itemId }: { itemId: string }) {
  const [channel, setChannel] = useState("CUSTOMER_QR");
  const [fulfillmentType, setFulfillmentType] = useState("DELIVERY");
  const [status, setStatus] = useState("OUT_OF_STOCK");
  const [isHidden, setIsHidden] = useState(false);
  const [reason, setReason] = useState("");
  const key = ["menu-items", itemId, "channel-overrides"];
  const { data: overrides = [] } = useQuery<any[]>({ queryKey: key, queryFn: async () => (await apiClient.get(`/menu/items/${itemId}/channel-overrides`)).data.data });
  const save = useMutation({ mutationFn: () => apiClient.put(`/menu/items/${itemId}/channel-overrides`, { channel, fulfillmentType, status, isHidden, availabilityReason: reason || null }), onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) });
  const remove = useMutation({ mutationFn: (id: string) => apiClient.delete(`/menu/items/channel-overrides/${id}`), onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) });
  return <div className="space-y-2">
    <span className="text-sm font-medium text-text-primary">Channel availability <span className="font-normal text-text-disabled">(overrides this item only for the selected ordering context)</span></span>
    {overrides.map((override) => <div key={override.id} className="flex items-center justify-between rounded bg-surface-secondary px-3 py-2 text-xs"><span>{override.channel} · {override.fulfillmentType ?? "All fulfillment"} · {override.isHidden ? "Hidden" : override.status ?? "Default"}</span><button type="button" className="text-danger" onClick={() => remove.mutate(override.id)}>Remove</button></div>)}
    <div className="grid grid-cols-2 gap-2 rounded border border-border p-2">
      <select aria-label="Ordering channel" value={channel} onChange={(event) => setChannel(event.target.value)} className="rounded border border-border px-2 py-1.5 text-sm"><option value="STAFF">Staff</option><option value="CUSTOMER_QR">Customer QR</option></select>
      <select aria-label="Fulfillment type" value={fulfillmentType} onChange={(event) => setFulfillmentType(event.target.value)} className="rounded border border-border px-2 py-1.5 text-sm">{TYPES.map((type) => <option key={type}>{type}</option>)}</select>
      <select aria-label="Channel status" value={status} onChange={(event) => setStatus(event.target.value)} className="rounded border border-border px-2 py-1.5 text-sm"><option value="ACTIVE">Active</option><option value="OUT_OF_STOCK">Out of stock</option><option value="HIDDEN">Hidden status</option><option value="SEASONAL">Seasonal</option><option value="DISCONTINUED">Discontinued</option></select>
      <Input aria-label="Channel override reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason (optional)" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isHidden} onChange={(event) => setIsHidden(event.target.checked)} /> Hide from this channel</label>
      <Button type="button" size="sm" loading={save.isPending} onClick={() => save.mutate()}>Save override</Button>
    </div>
  </div>;
}
