import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Select } from "@pos/ui";
import { createCustomersApi } from "@pos/api-client";
import { createMenuApi } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";

const menuApi = createMenuApi(apiClient);
import type { CustomerLoyaltyTier, LoyaltyCustomer } from "@pos/types";

const customersApi = createCustomersApi(apiClient);

export function LoyaltySection() {
  const qc = useQueryClient();
  const [tierName, setTierName] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [discountValue, setDiscountValue] = useState("5");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerTierId, setCustomerTierId] = useState("");
  const { data: tiers = [] } = useQuery<CustomerLoyaltyTier[]>({ queryKey: ["loyalty", "tiers"], queryFn: () => menuApi.listLoyaltyTiers<CustomerLoyaltyTier>() });
  const { data: customers = [] } = useQuery<LoyaltyCustomer[]>({ queryKey: ["loyalty", "customers"], queryFn: customersApi.list });
  const createTier = useMutation({ mutationFn: () => menuApi.createLoyaltyTier<CustomerLoyaltyTier>({ name: tierName, ...(discountType === "PERCENT" ? { discountPercent: Number(discountValue) } : { discountFixed: Number(discountValue) }) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["loyalty"] }); setTierName(""); } });
  const createCustomer = useMutation({ mutationFn: () => customersApi.create({ name: customerName, ...(customerPhone ? { phone: customerPhone } : {}), ...(customerEmail ? { email: customerEmail } : {}), ...(customerTierId ? { loyaltyTierId: customerTierId } : {}) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["loyalty", "customers"] }); setCustomerName(""); setCustomerPhone(""); setCustomerEmail(""); } });
  const assign = useMutation({ mutationFn: ({ id, loyaltyTierId }: { id: string; loyaltyTierId: string | null }) => customersApi.assignTier(id, loyaltyTierId), onSuccess: () => qc.invalidateQueries({ queryKey: ["loyalty", "customers"] }) });
  const removeTier = useMutation({ mutationFn: (id: string) => menuApi.removeLoyaltyTier(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["loyalty"] }) });

  return <div className="space-y-6">
    <div><h2 className="font-semibold text-text-primary">Loyalty pricing</h2><p className="text-sm text-text-secondary">Stage 6 applies a customer tier after promotions. Non-stackable promotions explicitly compete with the loyalty discount and the larger discount wins.</p></div>
    <div className="grid gap-3 rounded-xl border border-border p-4 md:grid-cols-4"><Input label="Tier name" value={tierName} onChange={(e) => setTierName(e.target.value)} /><Select label="Discount" value={discountType} onChange={(e) => setDiscountType(e.target.value as "PERCENT" | "FIXED")} options={[{ value: "PERCENT", label: "Percentage" }, { value: "FIXED", label: "Fixed amount" }]} /><Input label={discountType === "PERCENT" ? "Percent" : "Amount"} type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} /><div className="flex items-end"><Button disabled={!tierName.trim() || Number(discountValue) <= 0} loading={createTier.isPending} onClick={() => createTier.mutate()}>Add tier</Button></div></div>
    <div className="space-y-2">{tiers.map((tier) => <div key={tier.id} className="flex items-center justify-between rounded-lg border border-border p-3"><div><p className="font-medium text-text-primary">{tier.name}</p><p className="text-xs text-text-secondary">{tier.discountPercent !== null ? `${tier.discountPercent}% off` : `${tier.discountFixed} off`}</p></div><Button size="sm" variant="ghost" onClick={() => removeTier.mutate(tier.id)}>Delete</Button></div>)}</div>
    <div><h3 className="mb-3 font-medium text-text-primary">Customers</h3><div className="grid gap-3 rounded-xl border border-border p-4 md:grid-cols-4"><Input label="Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} /><Input label="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} /><Input label="Email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} /><Select label="Loyalty tier" value={customerTierId} onChange={(e) => setCustomerTierId(e.target.value)} options={[{ value: "", label: "No tier" }, ...tiers.map((tier) => ({ value: tier.id, label: tier.name }))]} /><Button disabled={!customerName.trim()} loading={createCustomer.isPending} onClick={() => createCustomer.mutate()}>Add customer</Button></div></div>
    <div className="space-y-2">{customers.map((customer) => <div key={customer.id} className="grid items-center gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_240px]"><div><p className="font-medium text-text-primary">{customer.name}</p><p className="text-xs text-text-secondary">{customer.phone || customer.email || "No contact"}</p></div><Select aria-label={`Loyalty tier for ${customer.name}`} value={customer.loyaltyTierId ?? ""} onChange={(e) => assign.mutate({ id: customer.id, loyaltyTierId: e.target.value || null })} options={[{ value: "", label: "No tier" }, ...tiers.map((tier) => ({ value: tier.id, label: tier.name }))]} /></div>)}</div>
  </div>;
}
