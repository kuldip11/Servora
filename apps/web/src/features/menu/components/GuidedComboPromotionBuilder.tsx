import { useEffect, useMemo, useState } from "react";
import { Button, Card, toast } from "@pos/ui";
import type { MenuCategory } from "@pos/types";
import { apiClient, extractApiError } from "../../../shared/lib/api-client";
import { usePermissions } from "../../../shared/auth/permissions";

type BuilderKind = "combo" | "promotion";
type ComboPolicy = "FIXED" | "PERCENT_OFF_SUM";
type PromotionType = "PERCENTAGE" | "FIXED_AMOUNT";
type MenuChoice = { id: string; name: string; categoryName: string };
type ComboSlotDraft = { id: number; name: string; menuItemId: string; upcharge: string };

const selectClass = "rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary";
const inputClass = "rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary";

export function GuidedComboPromotionBuilder() {
  const { has } = usePermissions();
  const [kind, setKind] = useState<BuilderKind>("combo");
  const [menuChoices, setMenuChoices] = useState<MenuChoice[]>([]);
  const [busy, setBusy] = useState(false);

  const [comboName, setComboName] = useState("");
  const [comboPolicy, setComboPolicy] = useState<ComboPolicy>("FIXED");
  const [comboValue, setComboValue] = useState("0");
  const [comboSlots, setComboSlots] = useState<ComboSlotDraft[]>([
    { id: 1, name: "Main", menuItemId: "", upcharge: "0" },
    { id: 2, name: "Side", menuItemId: "", upcharge: "0" },
  ]);
  const [comboPreview, setComboPreview] = useState<number | null>(null);

  const [promotionName, setPromotionName] = useState("");
  const [promotionType, setPromotionType] = useState<PromotionType>("PERCENTAGE");
  const [promotionValue, setPromotionValue] = useState("10");
  const [promotionCoupon, setPromotionCoupon] = useState("");
  const [promotionPreviewItemId, setPromotionPreviewItemId] = useState("");
  const [promotionPreview, setPromotionPreview] = useState<{ subtotal: number; discountAmount: number; totalAmount: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void apiClient.get("/menu/categories")
      .then((response) => {
        if (cancelled) return;
        const categories = response.data.data as MenuCategory[];
        setMenuChoices(categories.flatMap((category) =>
          (category.menuItems ?? [])
            .filter((item) => item.isPublished && item.status !== "DISCONTINUED")
            .map((item) => ({ id: item.id, name: item.name, categoryName: category.name })),
        ));
      })
      .catch((error: unknown) => toast({ title: extractApiError(error), tone: "danger" }));
    return () => { cancelled = true; };
  }, []);

  const comboPayload = useMemo(() => ({
    name: comboName.trim(),
    pricePolicy: comboPolicy,
    ...(comboPolicy === "FIXED" ? { fixedPrice: Number(comboValue) } : { percentOff: Number(comboValue) }),
    slots: comboSlots.map((slot) => ({
      name: slot.name.trim(),
      minSelections: 1,
      maxSelections: 1,
      options: [{
        menuItemId: slot.menuItemId,
        ...(Number(slot.upcharge) ? { upcharge: Number(slot.upcharge) } : {}),
      }],
    })),
  }), [comboName, comboPolicy, comboSlots, comboValue]);

  const comboReady = Boolean(
    comboName.trim() &&
      comboSlots.length > 0 &&
      comboSlots.every((slot) => slot.name.trim() && slot.menuItemId) &&
      Number.isFinite(Number(comboValue)) &&
      Number(comboValue) >= 0 &&
      (comboPolicy !== "PERCENT_OFF_SUM" || Number(comboValue) <= 100),
  );

  async function previewCombo() {
    if (!comboReady) return null;
    setBusy(true);
    try {
      const { name: _name, ...previewInput } = comboPayload;
      const response = await apiClient.post("/menu/combos/preview", previewInput);
      const total = Number(response.data.data.resolvedTotal);
      setComboPreview(total);
      return total;
    } catch (error) {
      setComboPreview(null);
      toast({ title: extractApiError(error), tone: "danger" });
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function createCombo() {
    if (!comboReady || !has("menu:create")) return;
    setBusy(true);
    try {
      const { name: _name, ...previewInput } = comboPayload;
      const previewResponse = await apiClient.post("/menu/combos/preview", previewInput);
      const authoritativePreview = Number(previewResponse.data.data.resolvedTotal);
      await apiClient.post("/menu/combos/", comboPayload);
      setComboPreview(authoritativePreview);
      setComboName("");
      toast({ title: `Combo created at previewed price ₹${authoritativePreview.toFixed(2)}`, tone: "success" });
    } catch (error) {
      toast({ title: extractApiError(error), tone: "danger" });
    } finally {
      setBusy(false);
    }
  }

  const promotionPayload = useMemo(() => ({
    name: promotionName.trim(),
    ruleType: promotionType,
    scope: "ORDER" as const,
    value: Number(promotionValue),
    ...(promotionCoupon.trim() ? { couponCode: promotionCoupon.trim() } : {}),
    isActive: true,
  }), [promotionCoupon, promotionName, promotionType, promotionValue]);

  const promotionReady = Boolean(
    promotionPayload.name &&
      promotionPreviewItemId &&
      Number.isFinite(promotionPayload.value) &&
      promotionPayload.value > 0 &&
      (promotionType !== "PERCENTAGE" || promotionPayload.value <= 100),
  );

  async function getPromotionPreview() {
    if (!promotionReady) return null;
    const response = await apiClient.post("/menu/promotions/preview", {
      promotion: promotionPayload,
      items: [{ menuItemId: promotionPreviewItemId, quantity: 1 }],
    });
    const result = response.data.data as { subtotal: number; discountAmount: number; totalAmount: number };
    setPromotionPreview(result);
    return result;
  }

  async function previewPromotion() {
    if (!promotionReady) return;
    setBusy(true);
    try {
      await getPromotionPreview();
    } catch (error) {
      setPromotionPreview(null);
      toast({ title: extractApiError(error), tone: "danger" });
    } finally {
      setBusy(false);
    }
  }

  async function createPromotion() {
    if (!promotionReady || !has("menu:pricing:write")) return;
    setBusy(true);
    try {
      const authoritativePreview = await getPromotionPreview();
      if (!authoritativePreview) return;
      await apiClient.post("/menu/promotions", promotionPayload);
      setPromotionName("");
      setPromotionCoupon("");
      toast({ title: `Promotion created · sample discount ₹${authoritativePreview.discountAmount.toFixed(2)}`, tone: "success" });
    } catch (error) {
      toast({ title: extractApiError(error), tone: "danger" });
    } finally {
      setBusy(false);
    }
  }

  if (!has("menu:pricing:write")) {
    return <Card><p className="text-sm text-text-secondary">Pricing-management permission is required to use the guided combo and promotion authoring flow.</p></Card>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={kind === "combo" ? "primary" : "secondary"}
            loading={kind === "combo" ? busy : false}
            disabled={kind === "combo" && (!comboReady || comboPreview === null || !has("menu:create"))}
            onClick={() => { if (kind !== "combo") { setKind("combo"); } else { void createCombo(); } }}
          >
            Create combo
          </Button>
          <Button
            variant={kind === "promotion" ? "primary" : "secondary"}
            loading={kind === "promotion" ? busy : false}
            disabled={kind === "promotion" && (!promotionReady || promotionPreview === null)}
            onClick={() => { if (kind !== "promotion") { setKind("promotion"); } else { void createPromotion(); } }}
          >
            Create promotion
          </Button>
        </div>
      </Card>

      {kind === "combo" ? (
        <Card>
          <h2 className="font-semibold text-text-primary">Guided combo builder</h2>
          <p className="mt-1 text-sm text-text-secondary">Name the offer, choose menu items in plain language, then preview through the exact server pricing path before saving. The advanced combo editor remains available for complex slot rules.</p>
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-sm font-medium text-text-primary">Combo name<input className={`mt-1 w-full ${inputClass}`} value={comboName} onChange={(event) => { setComboName(event.target.value); setComboPreview(null); }} placeholder="Lunch combo" /></label>
              <label className="text-sm font-medium text-text-primary">Pricing<select className={`mt-1 w-full ${selectClass}`} value={comboPolicy} onChange={(event) => { setComboPolicy(event.target.value as ComboPolicy); setComboPreview(null); }}><option value="FIXED">Fixed total</option><option value="PERCENT_OFF_SUM">Percent off components</option></select></label>
              <label className="text-sm font-medium text-text-primary">{comboPolicy === "FIXED" ? "Fixed price" : "Percent off"}<input className={`mt-1 w-full ${inputClass}`} type="number" min="0" max={comboPolicy === "PERCENT_OFF_SUM" ? "100" : undefined} step="0.01" value={comboValue} onChange={(event) => { setComboValue(event.target.value); setComboPreview(null); }} /></label>
            </div>
            <div className="space-y-3">
              {comboSlots.map((slot, index) => (
                <div key={slot.id} className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-[1fr_2fr_1fr_auto] md:items-end">
                  <label className="text-sm font-medium text-text-primary">Slot {index + 1}<input className={`mt-1 w-full ${inputClass}`} value={slot.name} onChange={(event) => { setComboSlots((current) => current.map((value) => value.id === slot.id ? { ...value, name: event.target.value } : value)); setComboPreview(null); }} /></label>
                  <label className="text-sm font-medium text-text-primary">Menu item<select className={`mt-1 w-full ${selectClass}`} value={slot.menuItemId} onChange={(event) => { setComboSlots((current) => current.map((value) => value.id === slot.id ? { ...value, menuItemId: event.target.value } : value)); setComboPreview(null); }}><option value="">Choose an item</option>{menuChoices.map((choice) => <option key={choice.id} value={choice.id}>{choice.categoryName} — {choice.name}</option>)}</select></label>
                  <label className="text-sm font-medium text-text-primary">Upcharge<input className={`mt-1 w-full ${inputClass}`} type="number" step="0.01" value={slot.upcharge} onChange={(event) => { setComboSlots((current) => current.map((value) => value.id === slot.id ? { ...value, upcharge: event.target.value } : value)); setComboPreview(null); }} /></label>
                  <Button variant="secondary" disabled={comboSlots.length === 1} onClick={() => { setComboSlots((current) => current.filter((value) => value.id !== slot.id)); setComboPreview(null); }}>Remove</Button>
                </div>
              ))}
              <Button variant="secondary" onClick={() => setComboSlots((current) => [...current, { id: Math.max(0, ...current.map((slot) => slot.id)) + 1, name: `Choice ${current.length + 1}`, menuItemId: "", upcharge: "0" }])}>+ Add slot</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" loading={busy} disabled={!comboReady} onClick={() => void previewCombo()}>Preview authoritative price</Button>
              {comboPreview !== null && <strong className="text-text-primary">Resolved total: ₹{comboPreview.toFixed(2)}</strong>}
            </div>
            {!has("menu:create") && <p className="text-xs text-warning">You can preview pricing but need menu-create permission to save a combo.</p>}
          </div>
        </Card>
      ) : (
        <Card>
          <h2 className="font-semibold text-text-primary">Guided promotion builder</h2>
          <p className="mt-1 text-sm text-text-secondary">Create the common order-level discount flow here. Advanced item/category/BOGO targeting remains available in the full Promotions editor.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium text-text-primary">Promotion name<input className={`mt-1 w-full ${inputClass}`} value={promotionName} onChange={(event) => { setPromotionName(event.target.value); setPromotionPreview(null); }} placeholder="Weekday special" /></label>
            <label className="text-sm font-medium text-text-primary">Discount type<select className={`mt-1 w-full ${selectClass}`} value={promotionType} onChange={(event) => { setPromotionType(event.target.value as PromotionType); setPromotionPreview(null); }}><option value="PERCENTAGE">Percentage</option><option value="FIXED_AMOUNT">Fixed amount</option></select></label>
            <label className="text-sm font-medium text-text-primary">{promotionType === "PERCENTAGE" ? "Percent off" : "Amount off"}<input className={`mt-1 w-full ${inputClass}`} type="number" min="0.01" max={promotionType === "PERCENTAGE" ? "100" : undefined} step="0.01" value={promotionValue} onChange={(event) => { setPromotionValue(event.target.value); setPromotionPreview(null); }} /></label>
            <label className="text-sm font-medium text-text-primary">Coupon code (optional)<input className={`mt-1 w-full ${inputClass}`} value={promotionCoupon} onChange={(event) => { setPromotionCoupon(event.target.value.toUpperCase()); setPromotionPreview(null); }} placeholder="LUNCH10" /></label>
            <label className="text-sm font-medium text-text-primary md:col-span-2">Preview against menu item<select className={`mt-1 w-full ${selectClass}`} value={promotionPreviewItemId} onChange={(event) => { setPromotionPreviewItemId(event.target.value); setPromotionPreview(null); }}><option value="">Choose an item</option>{menuChoices.map((choice) => <option key={choice.id} value={choice.id}>{choice.categoryName} — {choice.name}</option>)}</select></label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="secondary" loading={busy} disabled={!promotionReady} onClick={() => void previewPromotion()}>Preview authoritative discount</Button>
            {promotionPreview && <strong className="text-text-primary">Sample: ₹{promotionPreview.subtotal.toFixed(2)} − ₹{promotionPreview.discountAmount.toFixed(2)} → ₹{promotionPreview.totalAmount.toFixed(2)}</strong>}
          </div>
        </Card>
      )}
    </div>
  );
}
