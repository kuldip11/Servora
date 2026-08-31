import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Check } from "lucide-react";
import { BottomSheet, Button, TextInput } from "@pos/ui";
import type { SelectedModifier, CartItem } from "../types";
import type { OrderableMenuItem, OrderableModifierGroup, OrderableModifierOption } from "@pos/types";
import { COURSE_LABELS } from "../constants";
import { itemCustomizationSchema } from "@pos/validation";

interface Props {
  item: OrderableMenuItem;
  existingCartItem?: CartItem;
  onConfirm: (item: CartItem) => void;
  courseMode?: boolean;
  onClose: () => void;
}

type ZoneLabel = "LEFT" | "RIGHT" | "WHOLE";

export function ItemCustomiser({ item, existingCartItem, onConfirm, onClose, courseMode = false }: Props) {
  const hasVariants = item.variants?.length > 0;
  const groups: OrderableModifierGroup[] = (item.modifierGroupLinks ?? []).map((link) => link.group);
  const hasModifierGroups = groups.length > 0;
  const zoned = item.supportsZones === true;
  const requiresPricingInput = item.pricingMode === "WEIGHT_BASED" || item.pricingMode === "OPEN";
  const guidedBuilder = item.displayMode === "GUIDED_BUILDER";
  const [activeZone, setActiveZone] = useState<ZoneLabel>("LEFT");
  const [variantId, setVariantId] = useState(existingCartItem?.variantId ?? (hasVariants ? item.variants?.[0]?.id ?? "" : ""));
  const [selections, setSelections] = useState<Record<string, SelectedModifier[]>>(() => {
    const initial: Record<string, SelectedModifier[]> = {};
    for (const modifier of existingCartItem?.modifiers ?? []) {
      const bucket = zoned ? `${modifier.groupId}:${modifier.zoneLabel ?? "WHOLE"}` : modifier.groupId;
      (initial[bucket] ??= []).push(modifier);
    }
    return initial;
  });
  const [chefNotes, setChefNotes] = useState(existingCartItem?.chefNotes ?? "");
  const [seatLabel, setSeatLabel] = useState(existingCartItem?.seatLabel ?? "");
  const [course, setCourse] = useState<number>(existingCartItem?.course ?? 1);
  const [quantity, setQuantity] = useState(existingCartItem?.quantity ?? 1);
  const [weightQuantity, setWeightQuantity] = useState(existingCartItem?.weightQuantity != null ? String(existingCartItem.weightQuantity) : "");
  const [manualPrice, setManualPrice] = useState(existingCartItem?.manualPrice != null ? String(existingCartItem.manualPrice) : "");
  const [guidedStep, setGuidedStep] = useState(0);

  const selectedVariant = item.variants?.find((variant) => variant.id === variantId);
  const optionById = useMemo(() => new Map(groups.flatMap((group) => group.options.map((option) => [option.id, option] as const))), [groups]);
  const modifierPrice = (option: OrderableModifierOption | undefined) => {
    const scoped = variantId ? option?.variantPrices?.find((price) => price.variantId === variantId) : undefined;
    return Number(scoped?.additionalPrice ?? option?.additionalPrice ?? 0);
  };
  const allSelectedModifiers: SelectedModifier[] = (Object.values(selections) as SelectedModifier[][]).flat();
  const baseRate = Number(selectedVariant?.price ?? item.basePrice ?? 0);
  const corePrice = item.pricingMode === "WEIGHT_BASED"
    ? baseRate * Number(weightQuantity || 0)
    : item.pricingMode === "OPEN"
      ? Number(manualPrice || 0)
      : baseRate;
  const modifierTotalFor = (mods: SelectedModifier[]) => mods.reduce((sum, modifier) => {
    const option = optionById.get(modifier.optionId);
    return sum + modifierPrice(option) * modifier.quantity;
  }, 0);
  const modifierTotal = (() => {
    if (!zoned) return modifierTotalFor(allSelectedModifiers);
    const whole = modifierTotalFor(allSelectedModifiers.filter((modifier) => modifier.zoneLabel === "WHOLE"));
    const zoneLabels = [...new Set(allSelectedModifiers.map((modifier) => modifier.zoneLabel).filter((label): label is string => !!label && label !== "WHOLE"))];
    const totals = zoneLabels.map((label) => modifierTotalFor(allSelectedModifiers.filter((modifier) => modifier.zoneLabel === label)));
    const rule = item.zonePricingRule ?? "HIGHER";
    const zonedTotal = rule === "HIGHER" ? Math.max(0, ...totals) : rule === "AVERAGE" ? totals.reduce((sum, value) => sum + value, 0) / Math.max(1, totals.length) : totals.reduce((sum, value) => sum + value * 0.5, 0);
    return whole + zonedTotal;
  })();
  const unitPrice = corePrice + modifierTotal;

  useEffect(() => {
    if (!hasVariants && !hasModifierGroups && !existingCartItem && !requiresPricingInput) {
      onConfirm({ menuItemId: item.id, name: item.name, basePrice: Number(item.basePrice), modifiers: [], chefNotes: "", seatLabel: "", ...(courseMode ? { course: 1 } : {}), quantity: 1, unitPrice: Number(item.basePrice) });
      onClose();
    }
  }, []);

  if (!hasVariants && !hasModifierGroups && !existingCartItem && !requiresPricingInput) return null;

  const bucketFor = (groupId: string, zone: ZoneLabel = activeZone) => zoned ? `${groupId}:${zone}` : groupId;
  function selectOption(group: OrderableModifierGroup, option: OrderableModifierOption) {
    const bucket = bucketFor(group.id);
    setSelections((previous) => {
      const current = previous[bucket] ?? [];
      const already = current.find((modifier) => modifier.optionId === option.id);
      const makeModifier = (): SelectedModifier => ({ optionId: option.id, groupId: group.id, groupName: group.name, name: option.name, price: modifierPrice(option), quantity: 1, ...(zoned ? { zoneLabel: activeZone } : {}) });
      if (group.selectionType === "SINGLE") return { ...previous, [bucket]: already ? [] : [makeModifier()] };
      if (already) return { ...previous, [bucket]: current.filter((modifier) => modifier.optionId !== option.id) };
      if (group.maxSelections != null && current.length >= group.maxSelections) return previous;
      return { ...previous, [bucket]: [...current, makeModifier()] };
    });
  }
  function setOptionQuantity(group: OrderableModifierGroup, option: OrderableModifierOption, value: number) {
    const bucket = bucketFor(group.id);
    setSelections((previous) => ({ ...previous, [bucket]: (previous[bucket] ?? []).map((modifier) => modifier.optionId === option.id ? { ...modifier, quantity: Math.max(1, Math.min(value, option.maxQuantity ?? 1)) } : modifier) }));
  }

  const visibleGroups = groups.filter((group) => !group.dependsOnOptionId || allSelectedModifiers.some((option) => option.optionId === group.dependsOnOptionId));
  const boundedGuidedStep = Math.min(guidedStep, Math.max(visibleGroups.length - 1, 0));
  const renderedGroups = guidedBuilder
    ? visibleGroups.slice(boundedGuidedStep, boundedGuidedStep + 1)
    : visibleGroups;
  const activeGuidedGroup = guidedBuilder ? renderedGroups[0] : undefined;
  const activeGuidedBucket = activeGuidedGroup ? bucketFor(activeGuidedGroup.id) : null;
  const activeGuidedComplete = !activeGuidedGroup ||
    (selections[activeGuidedBucket ?? activeGuidedGroup.id]?.length ?? 0) >= activeGuidedGroup.minSelections;
  const unmetGroup = zoned
    ? (["LEFT", "RIGHT"] as const).flatMap((zone) => visibleGroups.map((group) => ({ ...group, zone }))).find((group) => (selections[bucketFor(group.id, group.zone)]?.length ?? 0) < group.minSelections)
    : visibleGroups.find((group) => (selections[group.id]?.length ?? 0) < group.minSelections);
  const pricingInputValid = item.pricingMode === "WEIGHT_BASED"
    ? !!item.weightUnit && Number(weightQuantity) > 0
    : item.pricingMode === "OPEN"
      ? Number.isFinite(Number(manualPrice)) && manualPrice !== "" && Number(manualPrice) >= Number(item.openPriceMin ?? 0) && (item.openPriceMax == null || Number(manualPrice) <= Number(item.openPriceMax))
      : true;

  function handleConfirm() {
    if (unmetGroup || !pricingInputValid) return;
    const validated = itemCustomizationSchema.safeParse({
      menuItemId: item.id,
      variantId: variantId || undefined,
      quantity,
      ...(item.pricingMode === "WEIGHT_BASED" ? { weightQuantity: Number(weightQuantity) } : {}),
      ...(item.pricingMode === "OPEN" ? { manualPrice: Number(manualPrice) } : {}),
      chefNotes,
      selectedOptions: allSelectedModifiers.map((modifier) => ({ optionId: modifier.optionId, quantity: modifier.quantity, ...(modifier.zoneLabel ? { zoneLabel: modifier.zoneLabel } : {}) })),
    });
    if (!validated.success) return;
    onConfirm({
      menuItemId: item.id,
      name: item.name,
      basePrice: Number(item.basePrice),
      ...(variantId ? { variantId } : {}),
      ...(selectedVariant ? { variantName: selectedVariant.name } : {}),
      modifiers: allSelectedModifiers,
      chefNotes,
      seatLabel,
      ...(courseMode ? { course } : {}),
      quantity,
      unitPrice,
      ...(item.pricingMode === "WEIGHT_BASED" ? { weightQuantity: Number(weightQuantity), ...(item.weightUnit ? { weightUnit: item.weightUnit } : {}) } : {}),
      ...(item.pricingMode === "OPEN" ? { manualPrice: Number(manualPrice) } : {}),
    });
    onClose();
  }

  return <BottomSheet open onClose={onClose} title={item.name} footer={<Button onClick={handleConfirm} disabled={!!unmetGroup || !pricingInputValid} className="w-full rounded-2xl py-4 justify-between"><span>{existingCartItem ? "Update Item" : "Add to Order"}</span><span>₹{(unitPrice * quantity).toFixed(2)}</span></Button>}>
    <div className="space-y-5">
      <p className="text-sm text-primary font-semibold -mt-1">Estimated ₹{unitPrice.toFixed(2)} × {quantity} = ₹{(unitPrice * quantity).toFixed(2)} <span className="font-normal text-text-secondary">· server confirms final price</span></p>
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Quantity</p><div className="flex items-center gap-4"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary"><Minus className="h-4 w-4" /></button><span className="w-8 text-center text-xl font-bold">{quantity}</span><button type="button" onClick={() => setQuantity((value) => value + 1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"><Plus className="h-4 w-4" /></button></div></div>

      {item.pricingMode === "WEIGHT_BASED" && <label className="block text-sm font-medium text-text-primary">Weight ({item.weightUnit ?? "unit"})<input className="mt-1.5 w-full rounded-xl border border-border bg-surface-secondary px-3 py-2" type="number" min="0.001" step="0.001" value={weightQuantity} onChange={(event) => setWeightQuantity(event.target.value)} placeholder={`Enter weight in ${item.weightUnit ?? "configured unit"}`} /></label>}
      {item.pricingMode === "OPEN" && <label className="block text-sm font-medium text-text-primary">Manual price<input className="mt-1.5 w-full rounded-xl border border-border bg-surface-secondary px-3 py-2" type="number" min={item.openPriceMin ?? 0} max={item.openPriceMax ?? undefined} step="0.01" value={manualPrice} onChange={(event) => setManualPrice(event.target.value)} placeholder={`${item.openPriceMin != null ? `Min ₹${item.openPriceMin}` : "Enter price"}${item.openPriceMax != null ? ` · Max ₹${item.openPriceMax}` : ""}`} /></label>}

      {hasVariants && <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Size / Variant</p><div className="space-y-2">{item.variants.map((variant) => { const unavailable = (variant.manualOverrideStatus ?? variant.status ?? "ACTIVE") !== "ACTIVE" || (variant.manualOverrideStatus !== "ACTIVE" && variant.manualStockCount != null && variant.manualStockCount <= 0); return <button type="button" key={variant.id} disabled={unavailable} onClick={() => setVariantId(variant.id)} className={`w-full rounded-xl border-2 px-4 py-3 text-left ${variantId === variant.id ? "border-primary bg-primary-surface" : "border-border"} disabled:opacity-50`}><span className="font-medium">{variant.name}{unavailable ? " — unavailable" : ""}</span><span className="float-right text-sm text-text-secondary">₹{Number(variant.price).toFixed(2)}</span></button>; })}</div></div>}

      {zoned && <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Apply toppings to</p><div className="grid grid-cols-3 gap-2">{(["LEFT", "RIGHT", "WHOLE"] as const).map((zone) => <button type="button" key={zone} onClick={() => setActiveZone(zone)} className={`rounded-xl border-2 px-3 py-2 text-xs font-semibold ${activeZone === zone ? "border-primary bg-primary-surface text-primary" : "border-border text-text-secondary"}`}>{zone === "WHOLE" ? "Whole item" : `${zone[0]}${zone.slice(1).toLowerCase()} half`}</button>)}</div><p className="mt-1 text-xs text-text-secondary">Left and right selections are priced together using {String(item.zonePricingRule ?? "HIGHER").toLowerCase()}.</p></div>}

      {guidedBuilder && visibleGroups.length > 0 && <div className="rounded-xl bg-primary-surface p-3"><p className="text-sm font-semibold text-primary">Build your dish · Step {boundedGuidedStep + 1} of {visibleGroups.length}</p><p className="mt-1 text-xs text-text-secondary">Complete each required choice before moving to the next step.</p></div>}

      {renderedGroups.map((group) => {
        const bucket = bucketFor(group.id);
        const picked = selections[bucket] ?? [];
        const atCap = group.maxSelections != null && picked.length >= group.maxSelections;
        return <div key={`${group.id}:${zoned ? activeZone : "whole"}`}><div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{group.name}{zoned ? ` · ${activeZone}` : ""}</p><span className="text-[11px] text-text-disabled">{group.minSelections > 0 ? `Required · ${group.minSelections}${group.maxSelections ? `–${group.maxSelections}` : "+"}` : "Optional"}</span></div><div className="space-y-2">{group.options.filter((option) => option.isAvailable).map((option) => { const selected = picked.find((modifier) => modifier.optionId === option.id); const disabled = !selected && group.selectionType === "MULTIPLE" && atCap; const resolvedPrice = modifierPrice(option); return <div key={option.id} className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 ${selected ? "border-primary bg-primary-surface" : disabled ? "border-divider opacity-40" : "border-border"}`}><button type="button" disabled={disabled} onClick={() => !disabled && selectOption(group, option)} className="flex flex-1 items-center gap-2 text-left"><span className={`flex h-4 w-4 items-center justify-center border-2 ${group.selectionType === "SINGLE" ? "rounded-full" : "rounded"} ${selected ? "border-primary bg-primary" : "border-text-disabled"}`}>{selected && <Check className="h-3 w-3 text-primary-foreground" />}</span><span className="text-sm font-medium">{option.name}</span></button><div className="flex items-center gap-2">{selected && option.maxQuantity > 1 && <div className="flex items-center gap-1"><button type="button" onClick={() => setOptionQuantity(group, option, selected.quantity - 1)} className="rounded-full bg-surface-secondary p-1"><Minus className="h-3 w-3" /></button><span className="w-4 text-center text-xs">{selected.quantity}</span><button type="button" onClick={() => setOptionQuantity(group, option, selected.quantity + 1)} className="rounded-full bg-primary p-1 text-primary-foreground"><Plus className="h-3 w-3" /></button></div>}<span className="min-w-16 text-right text-sm text-text-secondary">{resolvedPrice > 0 ? `+₹${resolvedPrice.toFixed(2)}` : "Free"}</span></div></div>; })}</div></div>;
      })}

      {guidedBuilder && visibleGroups.length > 1 && <div className="flex gap-2"><Button type="button" variant="secondary" disabled={boundedGuidedStep <= 0} onClick={() => setGuidedStep((step) => Math.max(0, step - 1))} className="flex-1">Previous</Button><Button type="button" variant="secondary" disabled={!activeGuidedComplete || boundedGuidedStep >= visibleGroups.length - 1} onClick={() => setGuidedStep((step) => Math.min(visibleGroups.length - 1, step + 1))} className="flex-1">Next step</Button></div>}

      {courseMode && <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Course</p><div className="flex gap-2">{([1,2,3] as const).map((value) => <button type="button" key={value} onClick={() => setCourse(value)} className={`flex-1 rounded-xl border-2 py-2.5 text-xs font-semibold ${course === value ? "border-primary bg-primary-surface text-primary" : "border-border text-text-secondary"}`}>{COURSE_LABELS[value]}</button>)}</div></div>}
      <TextInput label="Seat / diner (optional)" placeholder="e.g. Seat 1 or Priya" value={seatLabel} onChange={(event) => setSeatLabel(event.target.value)} />
      <TextInput label="Note for Chef" placeholder="e.g. no onion, extra spicy…" value={chefNotes} onChange={(event) => setChefNotes(event.target.value)} className="rounded-xl bg-surface-secondary" />
      {unmetGroup && <p className="text-center text-xs text-warning">Complete required choices for {"zone" in unmetGroup ? `${unmetGroup.zone} · ` : ""}{unmetGroup.name}.</p>}
      {!pricingInputValid && <p className="text-center text-xs text-danger">Enter a valid {item.pricingMode === "WEIGHT_BASED" ? "positive weight" : "manual price within the configured range"}.</p>}
    </div>
  </BottomSheet>;
}
