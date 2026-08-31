import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Input } from "@pos/ui";
import { apiClient } from "../../../shared/lib/api-client";
import { queryClient } from "../../../shared/lib/query-client";
import type { CustomerGroup, PriceRule } from "@pos/types";
import { getErrorMessage } from "../../../shared/lib/errors";

const FULFILLMENT_TYPES = ["DINE_IN", "TAKEAWAY", "DELIVERY", "ONLINE"];

const describeRule = (rule: PriceRule) => {
  const scope = [
    rule.channel ?? "Any channel",
    rule.fulfillmentType ?? "Any fulfillment",
    rule.branchId ? "This branch" : "All branches",
  ].join(" · ");
  const window = [
    rule.startDate || rule.endDate ? `${rule.startDate ?? "…"} → ${rule.endDate ?? "…"}` : null,
    rule.startTime || rule.endTime ? `${rule.startTime ?? "00:00"}–${rule.endTime ?? "24:00"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return `${scope}${window ? ` · ${window}` : ""}`;
};

/**
 * D1: authoring surface for the price_rules table — channel and time-window
 * dimensions activated for real use alongside the existing branch scope.
 * Rules resolve through the single authoritative PricingPipeline stage 1;
 * this panel only manages rows, it does not duplicate resolution logic.
 */
export function PriceRulesPanel({ itemId, branchId }: { itemId: string; branchId?: string | null }) {
  const [channel, setChannel] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState("");
  const [scopeToBranch, setScopeToBranch] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [price, setPrice] = useState("");
  const [priority, setPriority] = useState("0");
  const [customerGroupId, setCustomerGroupId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const key = ["menu-items", itemId, "price-rules"];
  const { data: customerGroups = [] } = useQuery<CustomerGroup[]>({
    queryKey: ["customer-groups"],
    queryFn: async () => (await apiClient.get("/customer-groups")).data.data,
  });

  const { data: rules = [] } = useQuery<PriceRule[]>({
    queryKey: key,
    queryFn: async () => (await apiClient.get(`/menu/price-rules`, { params: { menuItemId: itemId } })).data.data,
  });

  const save = useMutation({
    mutationFn: () =>
      apiClient.post(`/menu/price-rules`, {
        menuItemId: itemId,
        branchId: scopeToBranch && branchId ? branchId : undefined,
        channel: channel || undefined,
        fulfillmentType: fulfillmentType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        customerGroupId: customerGroupId || undefined,
        price: Number(price),
        priority: Number(priority) || 0,
      }),
    onSuccess: () => {
      setError(null);
      setPrice("");
      queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, "Could not save price rule"));
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/menu/price-rules/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-text-primary">
        Price rules{" "}
        <span className="font-normal text-text-disabled">
          (channel and time-window pricing — e.g. delivery markup, happy hour)
        </span>
      </span>
      {rules.map((rule) => (
        <div key={rule.id} className="flex items-center justify-between rounded bg-surface-secondary px-3 py-2 text-xs">
          <span>
            {rule.percentOff !== null ? `${rule.percentOff}% off` : `₹${rule.price}`} · {describeRule(rule)} · priority {rule.priority}
          </span>
          <button type="button" className="text-danger" onClick={() => remove.mutate(rule.id)}>
            Remove
          </button>
        </div>
      ))}
      <div className="grid grid-cols-2 gap-2 rounded border border-border p-2">
        <select
          aria-label="Rule channel"
          value={channel}
          onChange={(event) => setChannel(event.target.value)}
          className="rounded border border-border px-2 py-1.5 text-sm"
        >
          <option value="">Any channel</option>
          <option value="STAFF">Staff</option>
          <option value="CUSTOMER_QR">Customer QR</option>
        </select>
        <select
          aria-label="Rule fulfillment type"
          value={fulfillmentType}
          onChange={(event) => setFulfillmentType(event.target.value)}
          className="rounded border border-border px-2 py-1.5 text-sm"
        >
          <option value="">Any fulfillment</option>
          {FULFILLMENT_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
        {branchId ? (
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={scopeToBranch} onChange={(event) => setScopeToBranch(event.target.checked)} />
            Scope to this branch only
          </label>
        ) : null}
        <Input aria-label="Rule start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} placeholder="Start date" />
        <Input aria-label="Rule end date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} placeholder="End date" />
        <Input aria-label="Rule start time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} placeholder="Start time" />
        <Input aria-label="Rule end time" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} placeholder="End time" />
        <select aria-label="Customer group scope" value={customerGroupId} onChange={(event) => setCustomerGroupId(event.target.value)} className="rounded border border-border px-2 py-1.5 text-sm">
          <option value="">Any customer group</option>
          {customerGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
        </select>
        <Input aria-label="Rule price" type="number" min={0} step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Price" />
        <Input aria-label="Rule priority" type="number" value={priority} onChange={(event) => setPriority(event.target.value)} placeholder="Priority" />
        <Button
          type="button"
          size="sm"
          loading={save.isPending}
          disabled={!price}
          onClick={() => save.mutate()}
        >
          Save price rule
        </Button>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
