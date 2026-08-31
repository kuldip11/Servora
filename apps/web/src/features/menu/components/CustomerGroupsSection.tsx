import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Input } from "@pos/ui";
import type { CustomerGroup } from "@pos/types";
import { createCustomersApi } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";

const customersApi = createCustomersApi(apiClient);

export function CustomerGroupsSection() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<"NONE" | "PERCENT" | "FIXED">("NONE");
  const [discount, setDiscount] = useState("");
  const key = ["customer-groups"];
  const { data: groups = [] } = useQuery<CustomerGroup[]>({ queryKey: key, queryFn: customersApi.listGroups });

  const clear = () => { setEditingId(null); setName(""); setDiscountType("NONE"); setDiscount(""); };
  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        discountPercent: discountType === "PERCENT" && discount !== "" ? Number(discount) : null,
        discountFixed: discountType === "FIXED" && discount !== "" ? Number(discount) : null,
      };
      return editingId ? customersApi.updateGroup(editingId, payload) : customersApi.createGroup(payload);
    },
    onSuccess: async () => { clear(); await queryClient.invalidateQueries({ queryKey: key }); notifySuccess("Customer group saved"); },
    onError: (error) => notifyError(error, "Failed to save customer group"),
  });
  const remove = useMutation({
    mutationFn: customersApi.deleteGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    onError: (error) => notifyError(error, "Failed to delete customer group"),
  });

  return <section className="space-y-4">
    <div><h2 className="text-base font-semibold text-text-primary">Customer groups / memberships</h2><p className="mt-0.5 text-sm text-text-secondary">Create staff-assigned groups such as corporate accounts or VIP memberships, then scope item price rules to them.</p></div>
    <div className="grid max-w-2xl grid-cols-1 gap-2 md:grid-cols-3">
      <Input label="Group name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Corporate · Acme Ltd" />
      <label className="text-sm font-medium text-text-primary">Default discount<select className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" value={discountType} onChange={(event) => setDiscountType(event.target.value as typeof discountType)}><option value="NONE">None</option><option value="PERCENT">Percent</option><option value="FIXED">Fixed amount</option></select></label>
      {discountType !== "NONE" ? <Input label={discountType === "PERCENT" ? "Percent" : "Amount"} type="number" min="0" step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} /> : <div />}
      <div className="flex gap-2 md:col-span-3"><Button type="button" disabled={!name.trim()} loading={save.isPending} onClick={() => save.mutate()}>{editingId ? "Update group" : "Create group"}</Button>{editingId && <Button type="button" variant="secondary" onClick={clear}>Cancel</Button>}</div>
    </div>
    <div className="divide-y divide-divider rounded-lg border border-border">
      {groups.length === 0 && <p className="p-4 text-sm text-text-secondary">No customer groups yet.</p>}
      {groups.map((group) => <div key={group.id} className="flex items-center justify-between gap-3 p-3"><div><p className="text-sm font-medium text-text-primary">{group.name}</p><p className="text-xs text-text-secondary">{group.discountPercent != null ? `${Number(group.discountPercent)}% default discount` : group.discountFixed != null ? `₹${Number(group.discountFixed).toFixed(2)} default discount` : "No default discount · use scoped price rules"}</p></div><div className="flex gap-2"><Button type="button" size="sm" variant="secondary" onClick={() => { setEditingId(group.id); setName(group.name); if (group.discountPercent != null) { setDiscountType("PERCENT"); setDiscount(String(group.discountPercent)); } else if (group.discountFixed != null) { setDiscountType("FIXED"); setDiscount(String(group.discountFixed)); } else { setDiscountType("NONE"); setDiscount(""); } }}>Edit</Button><Button type="button" size="sm" variant="danger" loading={remove.isPending} onClick={() => { if (confirm(`Delete customer group "${group.name}"?`)) remove.mutate(group.id); }}>Delete</Button></div></div>)}
    </div>
  </section>;
}
