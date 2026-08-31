import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "@pos/ui";
import { MenuPicker } from "./create-order/MenuPicker";
import { OrderCart } from "./create-order/OrderCart";
import { useTables } from "../../tables/hooks/useTables";
import { useMenuCategories } from "../../menu/hooks/useMenuCategories";
import { useCreateOrder } from "../hooks/useCreateOrder";
import { toCartItemPayload } from "../services/orders.service";
import { ItemCustomizerModal } from "./ItemCustomizerModal";
import { cartItemKey, type CartItem } from "../utils/cartTypes";
import type { FoodType, MenuItem } from "@pos/types";
import { createOrderSchema } from "@pos/validation";
import { useBranches } from "../../branches/hooks/useBranches";
import { apiClient } from "../../../shared/lib/api-client";
import { useCourseSequencingEnabled } from "../hooks/useCourseSequencingEnabled";

const ALL_ORDER_TYPES = [
  {
    value: "DINE_IN",
    label: "Dine In",
    capabilityKey: "dineInEnabled" as const,
  },
  {
    value: "TAKEAWAY",
    label: "Takeaway",
    capabilityKey: "takeawayEnabled" as const,
  },
  {
    value: "DELIVERY",
    label: "Delivery",
    capabilityKey: "deliveryEnabled" as const,
  },
  { value: "ONLINE", label: "Online", capabilityKey: "onlineEnabled" as const },
];

export function CreateOrderModal({ onClose }: { onClose: () => void }) {
  const [orderType, setOrderType] = useState("DINE_IN");
  const [tableId, setTableId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [foodTypeFilter, setFoodTypeFilter] = useState<FoodType | "ALL">("ALL");
  const [customising, setCustomising] = useState<{ item: MenuItem } | null>(
    null,
  );
  const [validationError, setValidationError] = useState("");
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [courseMode, setCourseMode] = useState(false);
  const courseSequencingAvailable = useCourseSequencingEnabled();

  // Fetches data for the server-issued active branch context. If the
  // owner/manager is viewing "All Branches" this comes back as more than
  // one branch — in that case there's no single branch to filter against,
  // so we fall back to showing every order type (existing behaviour) and
  // let the backend be the enforcement point instead.
  const { data: branchesInScope } = useBranches();

  const currentBranch =
    branchesInScope?.length === 1 ? branchesInScope[0] : undefined;

  const availableOrderTypes = currentBranch
    ? ALL_ORDER_TYPES.filter((t) => currentBranch[t.capabilityKey])
    : ALL_ORDER_TYPES;

  const tablesEnabled = currentBranch ? currentBranch.tablesEnabled : true;

  // If the currently selected type falls out of what's available once we
  // know the branch (e.g. default DINE_IN but this branch has no dine-in),
  // snap to the first type that's actually enabled.
  useEffect(() => {
    if (!availableOrderTypes.length) return;
    if (!availableOrderTypes.some((t) => t.value === orderType)) {
      setOrderType(availableOrderTypes[0]!.value);
      setTableId("");
    }
  }, [currentBranch?.id]);

  const { data: categories } = useMenuCategories();
  const { data: activeMenus = [] } = useQuery<any[]>({
    queryKey: ["menus", "active", orderType],
    queryFn: async () => (await apiClient.get("/menu/menus/active", { params: { channel: "STAFF", fulfillmentType: orderType } })).data.data,
  });
  useEffect(() => {
    if (!activeMenus.some((menu) => menu.id === selectedMenuId)) setSelectedMenuId(activeMenus[0]?.id ?? "");
  }, [activeMenus, selectedMenuId]);
  const visibleItemIds = new Set(
    activeMenus.filter((menu) => !selectedMenuId || menu.id === selectedMenuId).flatMap((menu) => menu.memberships.map((membership: any) => membership.menuItemId)),
  );
  const scopedCategories = categories?.map((category: any) => ({ ...category, menuItems: (category.menuItems ?? []).filter((item: any) => visibleItemIds.has(item.id)) })).filter((category: any) => category.menuItems.length > 0);

  const { data: tables } = useTables({
    enabled: orderType === "DINE_IN" && tablesEnabled,
  });

  const createMutation = useCreateOrder();

  function handleItemClick(menuItem: MenuItem) {
    const hasOptions =
      menuItem.variants?.length > 0 ||
      (menuItem.modifierGroupLinks?.length ?? 0) > 0;
    if (hasOptions) {
      setCustomising({ item: menuItem });
      return;
    }
    addOrIncrementItem({
      menuItemId: menuItem.id,
      menuItemName: menuItem.name,
      basePrice: Number(menuItem.basePrice),
      modifiers: [],
      chefNotes: "",
      seatLabel: "",
      quantity: 1,
      ...(courseMode ? { courseNumber: 1 } : {}),
      unitPrice: Number(menuItem.basePrice),
    });
  }

  function addOrIncrementItem(newItem: CartItem) {
    setItems((prev) => {
      const key = cartItemKey(newItem);
      const existing = prev.find((i) => cartItemKey(i) === key);
      if (existing) {
        return prev.map((i) =>
          cartItemKey(i) === key
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i,
        );
      }
      return [...prev, newItem];
    });
  }

  function updateCourse(key: string, courseNumber: number) {
    setItems((prev) => prev.map((item) => cartItemKey(item) === key ? { ...item, courseNumber } : item));
  }

  function updateQty(key: string, delta: number) {
    setItems((prev) =>
      prev
        .map((i) =>
          cartItemKey(i) === key ? { ...i, quantity: i.quantity + delta } : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }

  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  function handleSubmit() {
    const parsed = createOrderSchema.safeParse({
      type: orderType,
      ...(orderType === "DINE_IN" && tableId && { tableId }),
      ...(notes && { notes }),
      items: items.map(toCartItemPayload),
    });
    if (!parsed.success) {
      setValidationError(
        parsed.error.issues[0]?.message ?? "Please review the order.",
      );
      return;
    }
    setValidationError("");
    // Normalize the Zod output to the service payload: the form schema makes
    // option quantity optional, but the API payload requires it.
    const payload = {
      type: parsed.data.type,
      ...(parsed.data.tableId !== undefined && {
        tableId: parsed.data.tableId,
      }),
      ...(parsed.data.customerId !== undefined && {
        customerId: parsed.data.customerId,
      }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
      items: (parsed.data.items ?? []).map((item) => ({
        ...item,
        ...(item.variantId !== undefined && { variantId: item.variantId }),
        ...(item.chefNotes !== undefined && { chefNotes: item.chefNotes }),
        ...(item.seatLabel && { seatLabel: item.seatLabel }),
        selectedOptions: (item.selectedOptions ?? []).map((option) => ({
          optionId: option.optionId,
          quantity: option.quantity ?? 1,
        })),
      })),
    };
    createMutation.mutate(payload, { onSuccess: onClose });
  }

  return (
    <Modal open title="New Order" onClose={onClose} size="xl">
      {courseSequencingAvailable && <label className="mb-4 flex items-center gap-2 rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm text-text-secondary"><input type="checkbox" checked={courseMode} onChange={(event) => { const enabled = event.target.checked; setCourseMode(enabled); setItems((current) => current.map((item) => enabled ? { ...item, courseNumber: item.courseNumber ?? 1 } : (({ courseNumber: _courseNumber, ...rest }) => rest)(item))); }} /><span><strong className="text-text-primary">Course mode</strong> — assign lines to courses; later courses are held until fired.</span></label>}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          {activeMenus.length > 1 && <label className="block text-sm font-medium">Menu<select className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2" value={selectedMenuId} onChange={(event) => setSelectedMenuId(event.target.value)}>{activeMenus.map((menu) => <option key={menu.id} value={menu.id}>{menu.name}</option>)}</select></label>}
        <MenuPicker
          orderType={orderType}
          tableId={tableId}
          tablesEnabled={tablesEnabled}
          tables={tables}
          categories={scopedCategories}
          filter={foodTypeFilter}
          availableOrderTypes={availableOrderTypes}
          onOrderTypeChange={(v) => {
            setOrderType(v);
            setTableId("");
          }}
          onTableChange={setTableId}
          onFilterChange={setFoodTypeFilter}
          onItemClick={handleItemClick}
        />
        </div>
        <OrderCart
          items={items}
          notes={notes}
          total={total}
          pending={createMutation.isPending}
          canSubmit={
            !!items.length &&
            !!availableOrderTypes.length &&
            !(orderType === "DINE_IN" && !tableId)
          }
          validationError={validationError}
          courseMode={courseMode}
          onQty={updateQty}
          onCourse={updateCourse}
          onNotes={setNotes}
          onSubmit={handleSubmit}
        />
      </div>

      {customising && (
        <ItemCustomizerModal
          item={customising.item}
          courseMode={courseMode}
          onConfirm={addOrIncrementItem}
          onClose={() => setCustomising(null)}
        />
      )}
    </Modal>
  );
}
