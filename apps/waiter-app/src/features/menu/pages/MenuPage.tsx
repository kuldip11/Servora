import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, ShoppingBag } from "lucide-react";
import { IconButton, toast } from "@pos/ui";
import { useRealtimeEvent } from "../../../shared/lib/realtime";
import { useCreateOrder } from "../../orders/hooks/useCreateOrder";
import { useAddOrderItems } from "../../orders/hooks/useAddOrderItems";
import { useMenuCategories } from "../hooks/useMenuCategories";
import { useMyBranch } from "../hooks/useMyBranch";
import { useTables } from "../hooks/useTables";
import { useCustomerSearch } from "../hooks/useCustomerSearch";
import { ALL_ORDER_TYPES } from "../constants";
import type { CartItem } from "../types";
import type { AddOrderItemInput } from "../../orders/api/orders";
import type { CreateOrderInput } from "../../orders/api/createOrder";
import { addOrderItemsSchema, createOrderSchema } from "@pos/validation";
import { cartItemKey } from "../utils/cart";
import { ItemCustomiser } from "../components/ItemCustomiser";
import { SearchBar } from "../components/SearchBar";
import { CategoryTabs } from "../components/CategoryTabs";
import { MenuGrid } from "../components/MenuGrid";
import { OrderOptionsPanel } from "../components/OrderOptionsPanel";
import { CartSummary } from "../components/CartSummary";

interface Props {
  onBack: () => void;
  onOrderPlaced: (orderId: string) => void;
  /** When set, adds items to an existing order instead of creating new */
  existingOrderId?: string;
}

// Design-system Phase 11, Sprint WA-2: this page's own chrome (header,
// cart strip) retokenized, and its back button moved onto `IconButton`
// (Phase 3) — `size="lg"` plus a `w-9 h-9` override reproduces the
// original 36px circle with a 20px icon exactly (`IconButton`'s own
// `md` default is a smaller 16px icon). One flagged, accepted loss:
// `IconButton`'s `ghost` variant has no persistent fill, only a hover
// fill, so the always-on `bg-surface-secondary` circle is forced via
// `className` — the original's `active:bg-gray-200` tap-darken feedback
// doesn't have an equivalent prop to carry over and is dropped here,
// same category of small interaction-detail loss `StaffPage`'s row
// actions accepted in Sprint AD-3.
//
// `SearchBar`/`CategoryTabs`/`MenuGrid`/`MenuItemCard`/
// `OrderOptionsPanel` (rendered below) are NOT touched this sprint —
// each is its own reasonably-sized component and a fair next sprint,
// not mechanically bundled in here just because this page renders them.
// This sprint's real work is `CartSummary`/`ItemCustomiser`, the app's
// 2 flagged overlays (see those files' own doc comments) — this page
// only needed its own wrapper chrome touched to render them.
export function MenuPage({ onBack, onOrderPlaced, existingOrderId }: Props) {
  const qc = useQueryClient();
  const isAddingToExisting = !!existingOrderId;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<
    "DINE_IN" | "TAKEAWAY" | "DELIVERY"
  >("DINE_IN");
  const [tableId, setTableId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [customising, setCustomising] = useState<{ item: any } | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [foodTypeFilter, setFoodTypeFilter] = useState<
    "ALL" | "VEG" | "NON_VEG" | "EGG"
  >("ALL");

  const { data: categories, isLoading: menuLoading } = useMenuCategories();
  const { data: myBranch } = useMyBranch();

  const availableOrderTypes = myBranch
    ? ALL_ORDER_TYPES.filter((t) => myBranch[t.capabilityKey])
    : ALL_ORDER_TYPES;
  const tablesEnabled = myBranch ? myBranch.tablesEnabled : true;

  useEffect(() => {
    if (!availableOrderTypes.length) return;
    if (!availableOrderTypes.some((t) => t.value === orderType)) {
      setOrderType(availableOrderTypes[0]!.value);
      setTableId("");
    }
  }, [myBranch?.id]);

  const { data: tables } = useTables(orderType === "DINE_IN" && tablesEnabled);

  useRealtimeEvent("table.updated", () => {
    qc.invalidateQueries({ queryKey: ["tables"] });
  });

  const { data: customerResults } = useCustomerSearch(customerSearch);

  useEffect(() => {
    if (categories?.length && !activeCategory)
      setActiveCategory(categories[0]?.id ?? null);
  }, [categories, activeCategory]);

  const addItemsMutation = useAddOrderItems();
  const createOrderMutation = useCreateOrder();

  function handleItemTap(item: any) {
    const hasOptions =
      item.variants?.length > 0 || item.modifierGroupLinks?.length > 0;
    if (hasOptions) {
      setCustomising({ item });
      return;
    }
    addOrIncrementItem({
      menuItemId: item.id,
      name: item.name,
      basePrice: parseFloat(item.basePrice),
      modifiers: [],
      chefNotes: "",
      course: 1,
      quantity: 1,
      unitPrice: parseFloat(item.basePrice),
    });
  }

  function addOrIncrementItem(newItem: CartItem) {
    setCart((prev) => {
      const key = cartItemKey(newItem);
      const ex = prev.find((c) => cartItemKey(c) === key);
      if (ex)
        return prev.map((c) =>
          cartItemKey(c) === key
            ? { ...c, quantity: c.quantity + newItem.quantity }
            : c,
        );
      return [...prev, newItem];
    });
    // Phase 14 toast consolidation: `@pos/ui`'s `toast()` supports `duration`
    // but has no per-call `icon` override (icon is derived from `tone` via
    // `TONE_ICON` — see Toast.tsx) — dropping the custom '✓' override since
    // `tone: 'success'` already renders a check icon (`CheckCircle2`), just
    // not this exact glyph. Flagged since it's a small but real visual
    // change, not a silent drop.
    toast({ title: `${newItem.name} added`, tone: "success", duration: 1000 });
  }

  function updateQty(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) =>
          cartItemKey(c) === key ? { ...c, quantity: c.quantity + delta } : c,
        )
        .filter((c) => c.quantity > 0),
    );
  }

  function handleSubmit() {
    const items: AddOrderItemInput[] = cart.map((i) => {
      const item: AddOrderItemInput = {
        menuItemId: i.menuItemId,
        quantity: i.quantity,
      };

      // With exactOptionalPropertyTypes enabled, optional properties must be
      // omitted rather than explicitly carrying `undefined`.
      if (i.variantId) item.variantId = i.variantId;
      if (i.chefNotes) item.chefNotes = i.chefNotes;
      if (i.modifiers.length) {
        item.selectedOptions = i.modifiers.map((m) => ({
          optionId: m.optionId,
          quantity: m.quantity,
        }));
      }

      return item;
    });

    if (isAddingToExisting) {
      const validated = addOrderItemsSchema.safeParse({
        items,
        ...(orderNotes ? { notes: orderNotes } : {}),
      });
      if (!validated.success) {
        toast({ title: "Please check the order details", tone: "danger" });
        return;
      }
      addItemsMutation.mutate(
        {
          orderId: existingOrderId!,
          items,
          ...(orderNotes ? { notes: orderNotes } : {}),
        },
        { onSuccess: () => onOrderPlaced(existingOrderId!) },
      );
    } else {
      const validated = createOrderSchema.safeParse({
        type: orderType,
        ...(orderType === "DINE_IN" && tableId ? { tableId } : {}),
        ...(customerId ? { customerId } : {}),
        ...(orderNotes ? { notes: orderNotes } : {}),
        items,
      });
      if (!validated.success) {
        toast({ title: "Please check the order details", tone: "danger" });
        return;
      }
      // Use the strictly typed `items` built above rather than `validated.data.items`.
      // The Zod schema permits optional fields to be `undefined`, while the
      // API input types use `exactOptionalPropertyTypes`, which requires those
      // fields to be omitted when they are not present.
      const orderInput: CreateOrderInput = {
        type: validated.data.type,
        items,
        ...(validated.data.tableId ? { tableId: validated.data.tableId } : {}),
        ...(validated.data.customerId
          ? { customerId: validated.data.customerId }
          : {}),
        ...(validated.data.notes ? { notes: validated.data.notes } : {}),
      };
      createOrderMutation.mutate(orderInput, {
        onSuccess: (data) => onOrderPlaced(data.id),
      });
    }
  }

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const allItems = categories?.flatMap((c: any) => c.menuItems ?? []) ?? [];
  const activeItems: any[] = (
    menuSearch.length >= 2
      ? allItems.filter(
          (i: any) =>
            i.isAvailable &&
            i.name.toLowerCase().includes(menuSearch.toLowerCase()),
        )
      : (categories
          ?.find((c: any) => c.id === activeCategory)
          ?.menuItems?.filter((i: any) => i.isAvailable) ?? [])
  ).filter(
    (i: any) => foodTypeFilter === "ALL" || i.foodType === foodTypeFilter,
  );

  const isPending = addItemsMutation.isPending || createOrderMutation.isPending;
  const needsTable = !isAddingToExisting && orderType === "DINE_IN" && !tableId;

  return (
    <div className="flex flex-col h-screen bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <IconButton
          icon={X}
          aria-label="Close menu"
          size="lg"
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-surface-secondary"
        />
        <h2 className="font-bold text-text-primary flex-1">
          {isAddingToExisting ? "Add Items to Order" : "New Order"}
        </h2>
        {totalItems > 0 && (
          <button
            onClick={() => setShowCart(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalItems} · ₹{totalPrice.toFixed(0)}
          </button>
        )}
      </div>

      {/* Order options — new orders only */}
      {!isAddingToExisting && (
        <OrderOptionsPanel
          availableOrderTypes={availableOrderTypes}
          orderType={orderType}
          onOrderTypeChange={(t) => {
            setOrderType(t);
            setTableId("");
          }}
          tablesEnabled={tablesEnabled}
          tables={tables}
          tableId={tableId}
          onTableChange={setTableId}
          customerId={customerId}
          customerName={customerName}
          onClearCustomer={() => {
            setCustomerId("");
            setCustomerName("");
          }}
          customerSearch={customerSearch}
          onCustomerSearchChange={setCustomerSearch}
          customerResults={customerResults}
          onSelectCustomer={(id, name) => {
            setCustomerId(id);
            setCustomerName(name);
            setCustomerSearch("");
          }}
        />
      )}

      {/* Search + category tabs */}
      <div className="bg-surface border-b border-border">
        <SearchBar value={menuSearch} onChange={setMenuSearch} />
        <CategoryTabs
          foodTypeFilter={foodTypeFilter}
          onFoodTypeChange={setFoodTypeFilter}
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          menuSearch={menuSearch}
        />
      </div>

      {/* Items */}
      <MenuGrid
        items={activeItems}
        cart={cart}
        isLoading={menuLoading}
        menuSearch={menuSearch}
        onItemTap={handleItemTap}
        onQtyChange={updateQty}
      />

      {/* Cart strip */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-4 py-4">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold flex items-center justify-between px-5"
          >
            <span className="w-7 h-7 bg-primary-foreground/20 rounded-full flex items-center justify-center text-xs font-bold">
              {totalItems}
            </span>
            <span>{isAddingToExisting ? "Review & Add" : "Review Order"}</span>
            <span>₹{totalPrice.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Customiser modal */}
      {customising && (
        <ItemCustomiser
          item={customising.item}
          onConfirm={addOrIncrementItem}
          onClose={() => setCustomising(null)}
        />
      )}

      {/* Cart modal */}
      {showCart && (
        <CartSummary
          cart={cart}
          isAddingToExisting={isAddingToExisting}
          orderNotes={orderNotes}
          onOrderNotesChange={setOrderNotes}
          totalItems={totalItems}
          totalPrice={totalPrice}
          isPending={isPending}
          needsTable={needsTable}
          onUpdateQty={updateQty}
          onSubmit={handleSubmit}
          onClose={() => setShowCart(false)}
        />
      )}
    </div>
  );
}
