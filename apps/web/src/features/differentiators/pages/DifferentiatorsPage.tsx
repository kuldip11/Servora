import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Page, PageHeader, toast } from "@pos/ui";
import { createAnalyticsApi, createApprovalsApi, createAvailabilityApi, createMenuApi, createOrdersApi } from "@pos/api-client";
import { apiClient, extractApiError } from "../../../shared/lib/api-client";

const analyticsApi = createAnalyticsApi(apiClient);
const approvalsApi = createApprovalsApi(apiClient);
const availabilityApi = createAvailabilityApi(apiClient);
const menuApi = createMenuApi(apiClient);
const ordersApi = createOrdersApi(apiClient);
import { useRealtimeEvent } from "../../../shared/lib/realtime";

type Tab = "availability" | "engineering" | "explain" | "builder" | "approvals";
type EngineeringQuadrant = "STAR" | "PUZZLE" | "PLOWHORSE" | "DOG";
type EngineeringSort = "margin" | "volume" | "name";
type BuilderKind = "combo" | "promotion";
type ComboPolicy = "FIXED" | "PERCENT_OFF_SUM";
type PromotionType = "PERCENTAGE" | "FIXED_AMOUNT";

type EngineeringRow = {
  menuItemId: string;
  menuItemName: string;
  variantName: string | null;
  margin: number;
  salesVolume: number;
  quadrant: EngineeringQuadrant;
  recommendation: string;
};

type AvailabilityRow = {
  entityType: "ITEM" | "VARIANT" | "MODIFIER_OPTION";
  entityId: string;
  menuItemId: string;
  name: string;
  status: string;
  reason: string;
  cause: string;
  branchId: string;
  branchName?: string;
  channel: string;
  fulfillmentType: string;
};

type MenuChoice = { id: string; name: string; categoryName: string };
type ComboSlotDraft = { id: number; name: string; menuItemId: string; upcharge: string };

const selectClass = "rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary";
const inputClass = "rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary";

export function DifferentiatorsPage() {
  const [tab, setTab] = useState<Tab>("availability");
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [engineering, setEngineering] = useState<EngineeringRow[]>([]);
  const [orderId, setOrderId] = useState("");
  const [explain, setExplain] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  const [availabilityChannel, setAvailabilityChannel] = useState("UNSCOPED");
  const [availabilityFulfillment, setAvailabilityFulfillment] = useState("UNSCOPED");
  const [availabilityCause, setAvailabilityCause] = useState("");

  const [windowDays, setWindowDays] = useState("90");
  const [quadrantFilter, setQuadrantFilter] = useState<"ALL" | EngineeringQuadrant>("ALL");
  const [engineeringSort, setEngineeringSort] = useState<EngineeringSort>("volume");

  const [builderKind, setBuilderKind] = useState<BuilderKind>("combo");
  const [menuChoices, setMenuChoices] = useState<MenuChoice[]>([]);
  const [comboName, setComboName] = useState("");
  const [comboPolicy, setComboPolicy] = useState<ComboPolicy>("FIXED");
  const [comboValue, setComboValue] = useState("0");
  const [comboSlots, setComboSlots] = useState<ComboSlotDraft[]>([
    { id: 1, name: "Main", menuItemId: "", upcharge: "0" },
    { id: 2, name: "Side", menuItemId: "", upcharge: "0" },
  ]);
  const [preview, setPreview] = useState<number | null>(null);
  const [promotionName, setPromotionName] = useState("");
  const [promotionType, setPromotionType] = useState<PromotionType>("PERCENTAGE");
  const [promotionValue, setPromotionValue] = useState("10");
  const [promotionCoupon, setPromotionCoupon] = useState("");
  const [promotionPreviewItemId, setPromotionPreviewItemId] = useState("");
  const [promotionPreview, setPromotionPreview] = useState<{ subtotal: number; discountAmount: number; totalAmount: number } | null>(null);

  const [action, setAction] = useState<"VOID" | "COMP">("COMP");
  const [threshold, setThreshold] = useState("500");
  const [requiresRole, setRequiresRole] = useState("Manager");

  const fail = (error: unknown) =>
    toast({ title: extractApiError(error), tone: "danger" });

  async function loadAvailability() {
    try {
      const response = await availabilityApi.dashboard<{ rows: AvailabilityRow[] }>({
        channel: availabilityChannel,
        fulfillmentType: availabilityFulfillment,
        ...(availabilityCause.trim() ? { cause: availabilityCause.trim() } : {}),
      });
      setAvailability(response.rows);
    } catch (error) {
      fail(error);
    }
  }

  async function loadEngineering(days = windowDays) {
    try {
      setEngineering(await analyticsApi.menuEngineering<EngineeringRow[]>(Number(days)));
    } catch (error) {
      fail(error);
    }
  }

  async function loadMenuChoices() {
    try {
      const categories = await menuApi.listCategories();
      setMenuChoices(
        categories.flatMap((category) =>
          (category.menuItems ?? [])
            .filter((item) => item.isPublished && item.status !== "DISCONTINUED")
            .map((item) => ({ id: item.id, name: item.name, categoryName: category.name })),
        ),
      );
    } catch (error) {
      fail(error);
    }
  }

  useEffect(() => {
    void loadAvailability();
    void loadEngineering("90");
    void loadMenuChoices();

  }, []);

  useRealtimeEvent("menu.availability.updated", () => {
    void loadAvailability();
  });

  const visibleEngineering = useMemo(() => {
    const rows = quadrantFilter === "ALL"
      ? [...engineering]
      : engineering.filter((row) => row.quadrant === quadrantFilter);
    return rows.sort((a, b) => {
      if (engineeringSort === "margin") return b.margin - a.margin;
      if (engineeringSort === "volume") return b.salesVolume - a.salesVolume;
      return a.menuItemName.localeCompare(b.menuItemName) || (a.variantName ?? "").localeCompare(b.variantName ?? "");
    });
  }, [engineering, engineeringSort, quadrantFilter]);

  const comboPayload = useMemo(() => ({
    name: comboName.trim(),
    pricePolicy: comboPolicy,
    ...(comboPolicy === "FIXED"
      ? { fixedPrice: Number(comboValue) }
      : { percentOff: Number(comboValue) }),
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
      Number(comboValue) >= 0,
  );

  async function previewCombo() {
    if (!comboReady) return;
    setBusy(true);
    try {
      const { name: _name, ...previewInput } = comboPayload;
      const response = await menuApi.previewCombo<{ resolvedTotal: number }>(previewInput);
      setPreview(Number(response.resolvedTotal));
    } catch (error) {
      setPreview(null);
      fail(error);
    } finally {
      setBusy(false);
    }
  }

  async function createCombo() {
    if (!comboReady) return;
    setBusy(true);
    try {
      const response = await menuApi.previewCombo<{ resolvedTotal: number }>((() => {
        const { name: _name, ...previewInput } = comboPayload;
        return previewInput;
      })());
      const authoritativePreview = Number(response.resolvedTotal);
      await menuApi.createCombo(comboPayload);
      setPreview(authoritativePreview);
      toast({ title: `Combo created at previewed price ₹${authoritativePreview.toFixed(2)}`, tone: "success" });
      setComboName("");
    } catch (error) {
      fail(error);
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
    const result = await menuApi.previewPromotion<{ subtotal: number; discountAmount: number; totalAmount: number }>({
      promotion: promotionPayload,
      items: [{ menuItemId: promotionPreviewItemId, quantity: 1 }],
    });
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
      fail(error);
    } finally {
      setBusy(false);
    }
  }

  async function createPromotion() {
    if (!promotionReady) return;
    setBusy(true);
    try {

      const authoritativePreview = await getPromotionPreview();
      if (!authoritativePreview) return;
      await menuApi.createPromotion(promotionPayload);
      toast({
        title: `Promotion created · sample discount ₹${authoritativePreview.discountAmount.toFixed(2)}`,
        tone: "success",
      });
      setPromotionName("");
      setPromotionCoupon("");
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  }

  async function explainOrder() {
    if (!orderId.trim()) return;
    setBusy(true);
    try {
      setExplain(await ordersApi.explain<Record<string, unknown>>(orderId.trim()));
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  }

  async function saveThreshold() {
    setBusy(true);
    try {
      await approvalsApi.setThreshold(action, {
        thresholdAmount: Number(threshold),
        requiresRole: requiresRole.trim(),
      });
      toast({
        title: `${action === "COMP" ? "Comp" : "Void"} threshold saved`,
        tone: "success",
      });
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  }

  const tabs: Array<[Tab, string]> = [
    ["availability", "Live availability"],
    ["engineering", "Menu engineering"],
    ["explain", "Order explain"],
    ["builder", "Guided builder"],
    ["approvals", "Approval rules"],
  ];

  return (
    <Page>
      <PageHeader
        title="Differentiators"
        description="Deterministic order explanations, live availability, menu engineering, guided authoring, and approval controls."
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <Button key={id} variant={tab === id ? "primary" : "secondary"} onClick={() => setTab(id)}>
            {label}
          </Button>
        ))}
      </div>

      {tab === "availability" && (
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-semibold">Unavailable across authorized branches and channels</h2>
              <p className="mt-1 text-sm text-text-secondary">All availability comes from the authoritative resolver; this view only aggregates its output.</p>
            </div>
            <Button onClick={loadAvailability}>Refresh</Button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="text-sm font-medium text-text-primary">Channel
              <select className={`mt-1 w-full ${selectClass}`} value={availabilityChannel} onChange={(event) => setAvailabilityChannel(event.target.value)}>
                <option value="UNSCOPED">All channels</option>
                <option value="STAFF">Staff</option>
                <option value="CUSTOMER_QR">Customer QR</option>
              </select>
            </label>
            <label className="text-sm font-medium text-text-primary">Fulfillment
              <select className={`mt-1 w-full ${selectClass}`} value={availabilityFulfillment} onChange={(event) => setAvailabilityFulfillment(event.target.value)}>
                <option value="UNSCOPED">All fulfillment types</option>
                <option value="DINE_IN">Dine in</option>
                <option value="TAKEAWAY">Takeaway</option>
                <option value="DELIVERY">Delivery</option>
                <option value="ONLINE">Online</option>
              </select>
            </label>
            <label className="text-sm font-medium text-text-primary">Cause
              <select className={`mt-1 w-full ${selectClass}`} value={availabilityCause} onChange={(event) => setAvailabilityCause(event.target.value)}>
                <option value="">All causes</option>
                <option value="MANUAL_OVERRIDE">Manual override</option>
                <option value="MANUAL_COUNT">Manual count</option>
                <option value="RECIPE_DRIVEN">Recipe / inventory</option>
                <option value="SCHEDULE">Schedule</option>
                <option value="CHANNEL_OVERRIDE">Channel override</option>
                <option value="BRANCH_OVERRIDE">Branch override</option>
                <option value="COMPUTED_STATUS">Computed variant status</option>
                <option value="BASE_STATUS">Base status</option>
              </select>
            </label>
          </div>
          <div className="mt-4 space-y-3">
            {availability.length ? availability.map((row) => (
              <div key={`${row.branchId}:${row.channel}:${row.fulfillmentType}:${row.entityType}:${row.entityId}`} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <strong>{row.name}</strong>
                    <p className="mt-1 text-xs text-text-secondary">{row.branchName ?? row.branchId} · {row.entityType.replace(/_/g, " ")} · {row.channel} · {row.fulfillmentType}</p>
                  </div>
                  <div className="flex items-center gap-2"><Badge variant="warning">{row.cause}</Badge><Badge variant="danger">{row.status}</Badge></div>
                </div>
                <p className="mt-2 text-sm text-text-secondary">{row.reason}</p>
              </div>
            )) : (
              <p className="text-sm text-text-secondary">Everything is available in the selected scope.</p>
            )}
          </div>
        </Card>
      )}

      {tab === "engineering" && (
        <div className="space-y-4">
          <Card>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-sm font-medium text-text-primary">Analysis window
                <select className={`mt-1 w-full ${selectClass}`} value={windowDays} onChange={(event) => { setWindowDays(event.target.value); void loadEngineering(event.target.value); }}>
                  <option value="30">Last 30 days</option><option value="60">Last 60 days</option><option value="90">Last 90 days</option><option value="180">Last 180 days</option><option value="365">Last 365 days</option>
                </select>
              </label>
              <label className="text-sm font-medium text-text-primary">Quadrant
                <select className={`mt-1 w-full ${selectClass}`} value={quadrantFilter} onChange={(event) => setQuadrantFilter(event.target.value as "ALL" | EngineeringQuadrant)}>
                  <option value="ALL">All quadrants</option><option value="STAR">Stars</option><option value="PUZZLE">Puzzles</option><option value="PLOWHORSE">Plowhorses</option><option value="DOG">Dogs</option>
                </select>
              </label>
              <label className="text-sm font-medium text-text-primary">Sort by
                <select className={`mt-1 w-full ${selectClass}`} value={engineeringSort} onChange={(event) => setEngineeringSort(event.target.value as EngineeringSort)}>
                  <option value="volume">Sales volume</option><option value="margin">Margin</option><option value="name">Name</option>
                </select>
              </label>
            </div>
          </Card>
          <div className="grid gap-3 md:grid-cols-2">
            {visibleEngineering.map((row) => (
              <Card key={`${row.menuItemId}:${row.variantName ?? ""}`}>
                <div className="flex justify-between gap-3"><strong>{row.menuItemName}{row.variantName ? ` — ${row.variantName}` : ""}</strong><Badge variant={row.quadrant === "STAR" ? "success" : row.quadrant === "DOG" ? "danger" : "warning"}>{row.quadrant}</Badge></div>
                <p className="mt-2 text-sm">{row.salesVolume} sold · margin ₹{row.margin.toFixed(2)}</p>
                <p className="mt-2 text-sm text-text-secondary">{row.recommendation}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "explain" && (
        <Card>
          <h2 className="font-semibold">Reconstruct an order</h2>
          <p className="mt-1 text-sm text-text-secondary">Uses the order's immutable resolution timestamp and fire-time resolver snapshots.</p>
          <div className="mt-3 flex gap-2">
            <input className={`min-w-0 flex-1 ${inputClass}`} value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Order UUID" />
            <Button loading={busy} disabled={!orderId.trim()} onClick={explainOrder}>Explain</Button>
          </div>
          {explain && <pre className="mt-4 max-h-[32rem] overflow-auto rounded-lg bg-surface-secondary p-4 text-xs">{JSON.stringify(explain, null, 2)}</pre>}
        </Card>
      )}

      {tab === "builder" && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap gap-2"><Button variant={builderKind === "combo" ? "primary" : "secondary"} onClick={() => setBuilderKind("combo")}>Create combo</Button><Button variant={builderKind === "promotion" ? "primary" : "secondary"} onClick={() => setBuilderKind("promotion")}>Create promotion</Button></div>
          </Card>
          {builderKind === "combo" ? (
            <Card>
              <h2 className="font-semibold">Guided combo builder</h2>
              <p className="mt-1 text-sm text-text-secondary">Step 1: name the offer. Step 2: choose real menu items by name. Step 3: preview through the same server pricing stages used by order creation.</p>
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="text-sm font-medium text-text-primary">Combo name<input className={`mt-1 w-full ${inputClass}`} value={comboName} onChange={(event) => { setComboName(event.target.value); setPreview(null); }} placeholder="Lunch combo" /></label>
                  <label className="text-sm font-medium text-text-primary">Pricing<select className={`mt-1 w-full ${selectClass}`} value={comboPolicy} onChange={(event) => { setComboPolicy(event.target.value as ComboPolicy); setPreview(null); }}><option value="FIXED">Fixed total</option><option value="PERCENT_OFF_SUM">Percent off components</option></select></label>
                  <label className="text-sm font-medium text-text-primary">{comboPolicy === "FIXED" ? "Fixed price" : "Percent off"}<input className={`mt-1 w-full ${inputClass}`} type="number" min="0" max={comboPolicy === "PERCENT_OFF_SUM" ? "100" : undefined} step="0.01" value={comboValue} onChange={(event) => { setComboValue(event.target.value); setPreview(null); }} /></label>
                </div>
                <div className="space-y-3">
                  {comboSlots.map((slot, index) => (
                    <div key={slot.id} className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-[1fr_2fr_1fr_auto] md:items-end">
                      <label className="text-sm font-medium text-text-primary">Slot {index + 1}<input className={`mt-1 w-full ${inputClass}`} value={slot.name} onChange={(event) => { setComboSlots((current) => current.map((value) => value.id === slot.id ? { ...value, name: event.target.value } : value)); setPreview(null); }} /></label>
                      <label className="text-sm font-medium text-text-primary">Menu item<select className={`mt-1 w-full ${selectClass}`} value={slot.menuItemId} onChange={(event) => { setComboSlots((current) => current.map((value) => value.id === slot.id ? { ...value, menuItemId: event.target.value } : value)); setPreview(null); }}><option value="">Choose an item</option>{menuChoices.map((choice) => <option key={choice.id} value={choice.id}>{choice.categoryName} — {choice.name}</option>)}</select></label>
                      <label className="text-sm font-medium text-text-primary">Upcharge<input className={`mt-1 w-full ${inputClass}`} type="number" step="0.01" value={slot.upcharge} onChange={(event) => { setComboSlots((current) => current.map((value) => value.id === slot.id ? { ...value, upcharge: event.target.value } : value)); setPreview(null); }} /></label>
                      <Button variant="secondary" disabled={comboSlots.length === 1} onClick={() => { setComboSlots((current) => current.filter((value) => value.id !== slot.id)); setPreview(null); }}>Remove</Button>
                    </div>
                  ))}
                  <Button variant="secondary" onClick={() => setComboSlots((current) => [...current, { id: Math.max(0, ...current.map((slot) => slot.id)) + 1, name: `Choice ${current.length + 1}`, menuItemId: "", upcharge: "0" }])}>+ Add slot</Button>
                </div>
                <div className="flex flex-wrap items-center gap-2"><Button variant="secondary" loading={busy} disabled={!comboReady} onClick={previewCombo}>Preview authoritative price</Button><Button loading={busy} disabled={!comboReady || preview === null} onClick={createCombo}>Create combo</Button>{preview !== null && <strong>Resolved total: ₹{preview.toFixed(2)}</strong>}</div>
              </div>
            </Card>
          ) : (
            <Card>
              <h2 className="font-semibold">Guided promotion builder</h2>
              <p className="mt-1 text-sm text-text-secondary">Common order-level promotions are created here; advanced item/category/BOGO targeting remains in the full promotion editor.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm font-medium text-text-primary">Promotion name<input className={`mt-1 w-full ${inputClass}`} value={promotionName} onChange={(event) => { setPromotionName(event.target.value); setPromotionPreview(null); }} placeholder="Weekday special" /></label>
                <label className="text-sm font-medium text-text-primary">Discount type<select className={`mt-1 w-full ${selectClass}`} value={promotionType} onChange={(event) => { setPromotionType(event.target.value as PromotionType); setPromotionPreview(null); }}><option value="PERCENTAGE">Percentage</option><option value="FIXED_AMOUNT">Fixed amount</option></select></label>
                <label className="text-sm font-medium text-text-primary">{promotionType === "PERCENTAGE" ? "Percent off" : "Amount off"}<input className={`mt-1 w-full ${inputClass}`} type="number" min="0.01" max={promotionType === "PERCENTAGE" ? "100" : undefined} step="0.01" value={promotionValue} onChange={(event) => { setPromotionValue(event.target.value); setPromotionPreview(null); }} /></label>
                <label className="text-sm font-medium text-text-primary">Coupon code (optional)<input className={`mt-1 w-full ${inputClass}`} value={promotionCoupon} onChange={(event) => { setPromotionCoupon(event.target.value.toUpperCase()); setPromotionPreview(null); }} placeholder="LUNCH10" /></label>
                <label className="text-sm font-medium text-text-primary md:col-span-2">Preview against menu item<select className={`mt-1 w-full ${selectClass}`} value={promotionPreviewItemId} onChange={(event) => { setPromotionPreviewItemId(event.target.value); setPromotionPreview(null); }}><option value="">Choose an item</option>{menuChoices.map((choice) => <option key={choice.id} value={choice.id}>{choice.categoryName} — {choice.name}</option>)}</select></label>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button variant="secondary" loading={busy} disabled={!promotionReady} onClick={previewPromotion}>Preview authoritative discount</Button>
                <Button loading={busy} disabled={!promotionReady || promotionPreview === null} onClick={createPromotion}>Create promotion</Button>
                {promotionPreview && <strong>Sample: ₹{promotionPreview.subtotal.toFixed(2)} − ₹{promotionPreview.discountAmount.toFixed(2)} → ₹{promotionPreview.totalAmount.toFixed(2)}</strong>}
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === "approvals" && (
        <Card>
          <h2 className="font-semibold">Manager approval threshold</h2>
          <p className="mt-1 text-sm text-text-secondary">Void/comp actions above the configured amount require a short-lived, single-use approval from the selected role.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-4 md:items-end">
            <label className="text-sm font-medium text-text-primary">Action<select className={`mt-1 w-full ${selectClass}`} value={action} onChange={(event) => setAction(event.target.value as "VOID" | "COMP")}><option value="COMP">Comp</option><option value="VOID">Void</option></select></label>
            <label className="text-sm font-medium text-text-primary">Threshold amount<input className={`mt-1 w-full ${inputClass}`} type="number" min="0" step="0.01" value={threshold} onChange={(event) => setThreshold(event.target.value)} /></label>
            <label className="text-sm font-medium text-text-primary">Required role<input className={`mt-1 w-full ${inputClass}`} value={requiresRole} onChange={(event) => setRequiresRole(event.target.value)} placeholder="Manager" /></label>
            <Button loading={busy} disabled={!requiresRole.trim() || Number(threshold) < 0} onClick={saveThreshold}>Save threshold</Button>
          </div>
        </Card>
      )}
    </Page>
  );
}

export default DifferentiatorsPage;
