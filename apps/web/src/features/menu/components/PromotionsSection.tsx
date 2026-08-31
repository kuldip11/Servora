import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Select } from "@pos/ui";
import { apiClient } from "../../../shared/lib/api-client";
import type { Promotion, PromotionStats as PromotionStatsData } from "@pos/types";


function PromotionStats({ id }: { id: string }) {
  const { data } = useQuery<PromotionStatsData>({
    queryKey: ["menu", "promotions", id, "stats"],
    queryFn: async () => (await apiClient.get(`/menu/promotions/${id}/stats`)).data.data,
  });
  return <span>{data ? `${data.uses} uses · ${Number(data.discountAmount).toFixed(2)} discounted` : "Loading stats…"}</span>;
}

export function PromotionsSection() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [ruleType, setRuleType] = useState<Promotion["ruleType"]>("PERCENTAGE");
  const [scope, setScope] = useState<Promotion["scope"]>("ORDER");
  const [value, setValue] = useState("10");
  const [couponCode, setCouponCode] = useState("");
  const [targetId, setTargetId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxUsesTotal, setMaxUsesTotal] = useState("");
  const [maxUsesPerCustomer, setMaxUsesPerCustomer] = useState("");
  const [triggerType, setTriggerType] = useState<"ITEM" | "CATEGORY">("ITEM");
  const [triggerId, setTriggerId] = useState("");
  const [rewardType, setRewardType] = useState<"SAME" | "ITEM" | "CATEGORY">("SAME");
  const [rewardId, setRewardId] = useState("");
  const [triggerQuantity, setTriggerQuantity] = useState("2");
  const [rewardQuantity, setRewardQuantity] = useState("1");
  const [rewardDiscountPercent, setRewardDiscountPercent] = useState("100");
  const [stackableWithLoyalty, setStackableWithLoyalty] = useState(true);
  const key = ["menu", "promotions"];
  const { data: promotions = [] } = useQuery<Promotion[]>({
    queryKey: key,
    queryFn: async () => (await apiClient.get("/menu/promotions")).data.data,
  });
  const create = useMutation({
    mutationFn: () => {
      const payload = {
      name,
      ruleType,
      scope: ruleType === "BOGO" ? "ORDER" : scope,
      ...(ruleType !== "BOGO" ? { value: Number(value) } : {}),
      scopeCategoryId: ruleType !== "BOGO" && scope === "CATEGORY" ? targetId : null,
      scopeMenuItemId: ruleType !== "BOGO" && scope === "ITEM" ? targetId : null,
      triggerMenuItemId: ruleType === "BOGO" && triggerType === "ITEM" ? triggerId : null,
      triggerCategoryId: ruleType === "BOGO" && triggerType === "CATEGORY" ? triggerId : null,
      rewardMenuItemId: ruleType === "BOGO" && rewardType === "ITEM" ? rewardId : null,
      rewardCategoryId: ruleType === "BOGO" && rewardType === "CATEGORY" ? rewardId : null,
      ...(ruleType === "BOGO" ? {
        triggerQuantity: Number(triggerQuantity),
        rewardQuantity: Number(rewardQuantity),
        rewardDiscountPercent: Number(rewardDiscountPercent),
      } : {}),
      couponCode: couponCode.trim() || null,
      startDate: startDate || null,
      endDate: endDate || null,
      startTime: startTime || null,
      endTime: endTime || null,
      maxUsesTotal: maxUsesTotal ? Number(maxUsesTotal) : null,
      maxUsesPerCustomer: maxUsesPerCustomer ? Number(maxUsesPerCustomer) : null,
      stackableWithLoyalty,
      };
      return editingId ? apiClient.patch(`/menu/promotions/${editingId}`, payload) : apiClient.post("/menu/promotions", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      setEditingId(null); setName(""); setCouponCode(""); setTargetId(""); setTriggerId(""); setRewardId("");
    },
  });
  const update = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => apiClient.patch(`/menu/promotions/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/menu/promotions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const beginEdit = (promotion: Promotion) => {
    setEditingId(promotion.id);
    setName(promotion.name);
    setRuleType(promotion.ruleType);
    setScope(promotion.scope);
    setValue(promotion.value ?? "10");
    setCouponCode(promotion.couponCode ?? "");
    setTargetId(promotion.scopeCategoryId ?? promotion.scopeMenuItemId ?? "");
    setStartDate(promotion.startDate ?? ""); setEndDate(promotion.endDate ?? "");
    setStartTime(promotion.startTime ?? ""); setEndTime(promotion.endTime ?? "");
    setMaxUsesTotal(promotion.maxUsesTotal == null ? "" : String(promotion.maxUsesTotal));
    setMaxUsesPerCustomer(promotion.maxUsesPerCustomer == null ? "" : String(promotion.maxUsesPerCustomer));
    setTriggerType(promotion.triggerCategoryId ? "CATEGORY" : "ITEM");
    setTriggerId(promotion.triggerCategoryId ?? promotion.triggerMenuItemId ?? "");
    setRewardType(promotion.rewardCategoryId ? "CATEGORY" : promotion.rewardMenuItemId ? "ITEM" : "SAME");
    setRewardId(promotion.rewardCategoryId ?? promotion.rewardMenuItemId ?? "");
    setTriggerQuantity(String(promotion.triggerQuantity ?? 2)); setRewardQuantity(String(promotion.rewardQuantity ?? 1));
    setRewardDiscountPercent(String(promotion.rewardDiscountPercent ?? 100));
    setStackableWithLoyalty(promotion.stackableWithLoyalty);
  };

  const bogoValid = ruleType !== "BOGO" || (triggerId && Number(triggerQuantity) > 0 && Number(rewardQuantity) > 0 && Number(rewardDiscountPercent) > 0 && (rewardType === "SAME" || rewardId));
  const ordinaryValid = ruleType === "BOGO" || (Number(value) > 0 && (scope === "ORDER" || targetId));

  return <div className="space-y-5">
    <div>
      <h2 className="font-semibold text-text-primary">Promotions & coupons</h2>
      <p className="text-sm text-text-secondary">Stage 5 runs after resolved item/modifier/combo prices. Usage limits are committed transactionally and loyalty stacking is explicit.</p>
    </div>
    <div className="grid max-w-5xl gap-3 rounded-xl border border-border p-4 md:grid-cols-3">
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Select label="Type" value={ruleType} onChange={(e) => setRuleType(e.target.value as Promotion["ruleType"])} options={[{ value: "PERCENTAGE", label: "Percentage" }, { value: "FIXED_AMOUNT", label: "Fixed amount" }, { value: "BOGO", label: "Buy / get" }]} />
      {ruleType !== "BOGO" && <Input label={ruleType === "PERCENTAGE" ? "Percent off" : "Amount off"} type="number" value={value} onChange={(e) => setValue(e.target.value)} />}
      {ruleType !== "BOGO" && <Select label="Scope" value={scope} onChange={(e) => setScope(e.target.value as Promotion["scope"])} options={[{ value: "ORDER", label: "Whole order" }, { value: "CATEGORY", label: "Category" }, { value: "ITEM", label: "Menu item" }]} />}
      {ruleType !== "BOGO" && scope !== "ORDER" && <Input label={scope === "CATEGORY" ? "Category ID" : "Menu item ID"} value={targetId} onChange={(e) => setTargetId(e.target.value)} />}
      {ruleType === "BOGO" && <><Select label="Buy target" value={triggerType} onChange={(e) => setTriggerType(e.target.value as "ITEM" | "CATEGORY")} options={[{ value: "ITEM", label: "Menu item" }, { value: "CATEGORY", label: "Category" }]} /><Input label="Buy target ID" value={triggerId} onChange={(e) => setTriggerId(e.target.value)} /><Input label="Buy quantity" type="number" value={triggerQuantity} onChange={(e) => setTriggerQuantity(e.target.value)} /><Select label="Reward target" value={rewardType} onChange={(e) => setRewardType(e.target.value as "SAME" | "ITEM" | "CATEGORY")} options={[{ value: "SAME", label: "Same as buy target" }, { value: "ITEM", label: "Menu item" }, { value: "CATEGORY", label: "Category" }]} />{rewardType !== "SAME" && <Input label="Reward target ID" value={rewardId} onChange={(e) => setRewardId(e.target.value)} />}<Input label="Reward quantity" type="number" value={rewardQuantity} onChange={(e) => setRewardQuantity(e.target.value)} /><Input label="Reward discount %" type="number" value={rewardDiscountPercent} onChange={(e) => setRewardDiscountPercent(e.target.value)} /></>}
      <Input label="Coupon code (optional)" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
      <Input label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      <Input label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      <Input label="Start time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
      <Input label="End time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      <Input label="Max uses total" type="number" value={maxUsesTotal} onChange={(e) => setMaxUsesTotal(e.target.value)} />
      <Input label="Max uses / customer" type="number" value={maxUsesPerCustomer} onChange={(e) => setMaxUsesPerCustomer(e.target.value)} />
      <label className="flex items-center gap-2 text-sm text-text-secondary"><input type="checkbox" checked={stackableWithLoyalty} onChange={(e) => setStackableWithLoyalty(e.target.checked)} /> Stackable with loyalty</label>
      <div className="flex items-end gap-2"><Button disabled={!name.trim() || !bogoValid || !ordinaryValid} loading={create.isPending} onClick={() => create.mutate()}>{editingId ? "Save promotion" : "Create promotion"}</Button>{editingId && <Button variant="secondary" onClick={() => { setEditingId(null); setName(""); }}>Cancel</Button>}</div>
    </div>
    <div className="space-y-2">{promotions.map((promotion) => <div key={promotion.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"><div className="min-w-0 flex-1"><p className="font-medium text-text-primary">{promotion.name}</p><p className="text-xs text-text-secondary">{promotion.ruleType} · {promotion.ruleType === "BOGO" ? `buy ${promotion.triggerQuantity}, reward ${promotion.rewardQuantity} @ ${promotion.rewardDiscountPercent}%` : `${promotion.scope} · ${promotion.value}${promotion.ruleType === "PERCENTAGE" ? "%" : ""}`} · {promotion.couponCode ?? "automatic"} · {promotion.stackableWithLoyalty ? "stacks with loyalty" : "exclusive vs loyalty"}</p><p className="mt-1 text-xs text-text-disabled"><PromotionStats id={promotion.id} /></p></div><Button size="sm" variant="secondary" onClick={() => beginEdit(promotion)}>Edit</Button><Button size="sm" variant="secondary" onClick={() => update.mutate({ id: promotion.id, isActive: !promotion.isActive })}>{promotion.isActive ? "Disable" : "Enable"}</Button><Button size="sm" variant="ghost" onClick={() => remove.mutate(promotion.id)}>Delete</Button></div>)}</div>
  </div>;
}
