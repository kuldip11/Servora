import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { IconButton, SelectMenu, toast } from "@pos/ui";
import { useRealtimeEvent } from "@/shared/lib/realtime";
import { useCreateOrder } from "@/features/orders/hooks/useCreateOrder";
import { useAddOrderItems } from "@/features/orders/hooks/useAddOrderItems";
import { useMenuCategories } from "@/features/menu/hooks/useMenuCategories";
import { useMyBranch } from "@/features/menu/hooks/useMyBranch";
import { useTables } from "@/features/menu/hooks/useTables";
import { useCustomerSearch } from "@/features/menu/hooks/useCustomerSearch";
import { ALL_ORDER_TYPES } from "@/features/menu/constants";
import type { CartItem } from "@/features/menu/types";
import type { AddOrderItemInput } from "@/features/orders/api/orders";
import type { CreateOrderInput } from "@/features/orders/api/createOrder";
import type {
  WaiterCombo,
  WaiterComboCartLine,
  WaiterComboMenuItem,
  WaiterComboSelection,
} from "@/features/menu/combo";
import { comboLineKey, estimateComboSubtotal } from "@/features/menu/combo";
import { addOrderItemsSchema, createOrderSchema } from "@pos/validation";
import { cartItemKey, replaceCartItem } from "@/features/menu/utils/cart";
import { ItemCustomiser } from "@/features/menu/components/ItemCustomiser";
import { SearchBar } from "@/features/menu/components/SearchBar";
import { CategoryTabs } from "@/features/menu/components/CategoryTabs";
import { MenuGrid } from "@/features/menu/components/MenuGrid";
import { OrderOptionsPanel } from "@/features/menu/components/OrderOptionsPanel";
import { TabletOrderRail } from "@/features/menu/components/TabletOrderRail";
import { CartSummary } from "@/features/menu/components/CartSummary";
import { ComboCustomiser } from "@/features/menu/components/ComboCustomiser";
import { apiClient } from "@/shared/lib/api-client";
import {
  createAuthApi,
  createCustomersApi,
  createMenuApi,
} from "@pos/api-client";
import { STORAGE_KEYS } from "@/shared/constants/storage-keys";
import type { OrderableMenuItem, Tenant } from "@pos/types";
import type { WaiterMenuCategory } from "@/features/menu/api/menu";

const menuApi = createMenuApi(apiClient);
const customersApi = createCustomersApi(apiClient);
const authApi = createAuthApi(apiClient);

type ActiveMenu = {
  id: string;
  name: string;
  memberships: Array<{ menuItemId: string }>;
};

interface Props {
  onBack: () => void;
  onOrderPlaced: (orderId: string) => void;

  existingOrderId?: string;
}

export const MenuPage = ({ onBack, onOrderPlaced, existingOrderId }: Props) => {
  const qc = useQueryClient();
  const isAddingToExisting = !!existingOrderId;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [comboCart, setComboCart] = useState<WaiterComboCartLine[]>([]);
  const [customisingCombo, setCustomisingCombo] = useState<WaiterCombo | null>(
    null,
  );
  const [comboSelections, setComboSelections] = useState<
    WaiterComboSelection[]
  >([]);
  const [couponCode, setCouponCode] = useState("");
  const [selectedPromotionIds, setSelectedPromotionIds] = useState<string[]>(
    [],
  );
  const [orderType, setOrderType] = useState<
    "DINE_IN" | "TAKEAWAY" | "DELIVERY"
  >("DINE_IN");
  const [tableId, setTableId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerGroupId, setCustomerGroupId] = useState("");
  const [billingMode, setBillingMode] = useState<"LINE_ITEMS" | "PER_COVER">(
    "LINE_ITEMS",
  );
  const [coverCount, setCoverCount] = useState(1);
  const [perCoverPriceRuleId, setPerCoverPriceRuleId] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [customising, setCustomising] = useState<{
    item: OrderableMenuItem;
    existingCartItem?: CartItem;
    originalKey?: string;
  } | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [foodTypeFilter, setFoodTypeFilter] = useState<
    "ALL" | "VEG" | "NON_VEG" | "EGG"
  >("ALL");
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [courseMode, setCourseMode] = useState(false);
  const [roundCourseNumber, setRoundCourseNumber] = useState(1);

  const { data: categories, isLoading: menuLoading } = useMenuCategories();
  const { data: activeMenus = [], isLoading: activeMenusLoading } = useQuery<
    ActiveMenu[]
  >({
    queryKey: ["menus", "active", orderType],
    queryFn: () => menuApi.listActiveMenus<ActiveMenu>(orderType),
  });
  useEffect(() => {
    if (!activeMenus.some((menu) => menu.id === selectedMenuId))
      setSelectedMenuId(activeMenus[0]?.id ?? "");
  }, [activeMenus, selectedMenuId]);
  const visibleIds = new Set(
    activeMenus
      .filter((menu) => !selectedMenuId || menu.id === selectedMenuId)
      .flatMap((menu) =>
        menu.memberships.map((membership) => membership.menuItemId),
      ),
  );
  const scopedCategories = activeMenusLoading
    ? categories
    : categories
        ?.map((category) => ({
          ...category,
          menuItems: (category.menuItems ?? []).filter((item) =>
            visibleIds.has(item.id),
          ),
        }))
        .filter((category) => category.menuItems.length > 0);
  const tenantId = localStorage.getItem(STORAGE_KEYS.tenant);
  const { data: tenantSettings } = useQuery<Tenant | null>({
    queryKey: ["tenant-settings", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const memberships = await authApi.listTenants();
      return (
        memberships.find((entry) => entry.tenant.id === tenantId)?.tenant ??
        null
      );
    },
  });
  const courseSequencingAvailable =
    tenantSettings?.courseSequencingEnabled === true;

  const { data: combos = [] } = useQuery<WaiterCombo[]>({
    queryKey: ["menu-combos"],
    queryFn: () => menuApi.listCombos<WaiterCombo>(),
    enabled: !isAddingToExisting,
  });
  const { data: promotions = [] } = useQuery<
    Array<{
      id: string;
      name: string;
      couponCode: string | null;
      isActive: boolean;
    }>
  >({
    queryKey: ["menu-promotions"],
    queryFn: () =>
      menuApi.listPromotions<{
        id: string;
        name: string;
        couponCode: string | null;
        isActive: boolean;
      }>(),
  });
  const { data: customerGroups = [] } = useQuery<
    Array<{ id: string; name: string }>
  >({
    queryKey: ["customer-groups"],
    queryFn: () => customersApi.listGroups(),
    enabled: !isAddingToExisting,
  });
  const { data: priceRules = [] } = useQuery<
    Array<{
      id: string;
      isPerCover?: boolean;
      coverTier?: "ADULT" | "CHILD" | null;
      price: string | number | null;
    }>
  >({
    queryKey: ["menu-price-rules", "per-cover"],
    queryFn: () =>
      menuApi.listPriceRules<{
        id: string;
        isPerCover?: boolean;
        coverTier?: "ADULT" | "CHILD" | null;
        price: string | number | null;
      }>(),
    enabled: !isAddingToExisting,
  });
  const perCoverRules = priceRules.filter((rule) => rule.isPerCover);
  const activeCombos = combos.filter((combo) => combo.status === "ACTIVE");
  const menuById = useMemo(
    () =>
      new Map<string, WaiterComboMenuItem>(
        (
          scopedCategories?.flatMap(
            (category: { menuItems?: WaiterComboMenuItem[] }) =>
              category.menuItems ?? [],
          ) ?? []
        ).map((item) => [item.id, item]),
      ),
    [scopedCategories],
  );

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

  useRealtimeEvent("menu.availability.updated", () => {
    qc.invalidateQueries({ queryKey: ["menu-categories"] });
    qc.invalidateQueries({ queryKey: ["menus", "active"] });
    qc.invalidateQueries({ queryKey: ["menu-combos"] });
  });

  const { data: customerResults } = useCustomerSearch(customerSearch);

  useEffect(() => {
    if (scopedCategories?.length && !activeCategory)
      setActiveCategory(scopedCategories[0]?.id ?? null);
  }, [scopedCategories, activeCategory]);

  const addItemsMutation = useAddOrderItems();
  const createOrderMutation = useCreateOrder();

  function handleItemTap(item: OrderableMenuItem) {
    const hasOptions =
      item.variants?.length > 0 ||
      item.modifierGroupLinks?.length > 0 ||
      item.supportsZones === true ||
      item.pricingMode === "WEIGHT_BASED" ||
      item.pricingMode === "OPEN";
    if (hasOptions) {
      setCustomising({ item });
      return;
    }
    addOrIncrementItem({
      menuItemId: item.id,
      name: item.name,
      basePrice: Number(item.basePrice),
      modifiers: [],
      chefNotes: "",
      seatLabel: "",
      ...(courseMode ? { course: 1 } : {}),
      quantity: 1,
      unitPrice: Number(item.basePrice),
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
    toast({ title: `${newItem.name} added`, tone: "success", duration: 1000 });
  }

  function confirmCustomisedItem(newItem: CartItem) {
    const originalKey = customising?.originalKey;
    if (!originalKey) {
      addOrIncrementItem(newItem);
      return;
    }

    setCart((previous) => replaceCartItem(previous, originalKey, newItem));
    toast({
      title: `${newItem.name} updated`,
      tone: "success",
      duration: 1000,
    });
  }

  function editCartItem(key: string) {
    const existingCartItem = cart.find((item) => cartItemKey(item) === key);
    if (!existingCartItem) return;
    const menuItem = allItems.find(
      (item) => item.id === existingCartItem.menuItemId,
    );
    if (!menuItem) {
      toast({
        title: "This menu item is no longer available to edit",
        tone: "danger",
      });
      return;
    }
    setShowCart(false);
    setCustomising({ item: menuItem, existingCartItem, originalKey: key });
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

  function openCombo(combo: WaiterCombo) {
    setCustomisingCombo(combo);
    setComboSelections(
      combo.slots.map((slot) => ({ slotId: slot.id, optionIds: [] })),
    );
  }

  function toggleComboOption(slotId: string, optionId: string) {
    if (!customisingCombo) return;
    const slot = customisingCombo.slots.find((value) => value.id === slotId);
    if (!slot) return;
    setComboSelections((previous) =>
      previous.map((selection) => {
        if (selection.slotId !== slotId) return selection;
        if (selection.optionIds.includes(optionId)) {
          return {
            ...selection,
            optionIds: selection.optionIds.filter((id) => id !== optionId),
          };
        }
        if (selection.optionIds.length >= slot.maxSelections) {
          if (slot.maxSelections === 1)
            return { ...selection, optionIds: [optionId] };
          return selection;
        }
        return { ...selection, optionIds: [...selection.optionIds, optionId] };
      }),
    );
  }

  function addSelectedCombo() {
    if (!customisingCombo) return;
    const line: WaiterComboCartLine = {
      combo: customisingCombo,
      quantity: 1,
      selections: comboSelections,
      ...(courseMode && !isAddingToExisting ? { courseNumber: 1 } : {}),
    };
    const key = comboLineKey(line);
    setComboCart((previous) => {
      const existing = previous.find((value) => comboLineKey(value) === key);
      if (existing)
        return previous.map((value) =>
          comboLineKey(value) === key
            ? { ...value, quantity: value.quantity + 1 }
            : value,
        );
      return [...previous, line];
    });
    setCustomisingCombo(null);
    setComboSelections([]);
    toast({
      title: `${customisingCombo.name} added`,
      tone: "success",
      duration: 1000,
    });
  }

  function updateComboQty(key: string, delta: number) {
    setComboCart((previous) =>
      previous
        .map((value) =>
          comboLineKey(value) === key
            ? { ...value, quantity: value.quantity + delta }
            : value,
        )
        .filter((value) => value.quantity > 0),
    );
  }

  function setCourseModeEnabled(enabled: boolean) {
    setCourseMode(enabled);
    if (isAddingToExisting) return;
    setCart((current) =>
      current.map((item) =>
        enabled
          ? { ...item, course: item.course ?? 1 }
          : (({ course: _course, ...rest }) => rest)(item),
      ),
    );
    setComboCart((current) =>
      current.map((line) =>
        enabled
          ? { ...line, courseNumber: line.courseNumber ?? 1 }
          : (({ courseNumber: _courseNumber, ...rest }) => rest)(line),
      ),
    );
  }

  function updateItemCourse(key: string, course: number) {
    setCart((current) =>
      current.map((item) =>
        cartItemKey(item) === key ? { ...item, course } : item,
      ),
    );
  }

  function updateComboCourse(key: string, courseNumber: number) {
    setComboCart((current) =>
      current.map((line) =>
        comboLineKey(line) === key ? { ...line, courseNumber } : line,
      ),
    );
  }

  function handleSubmit() {
    const items: AddOrderItemInput[] = cart.map((i) => {
      const item: AddOrderItemInput = {
        menuItemId: i.menuItemId,
        quantity: i.quantity,
      };

      if (i.variantId) item.variantId = i.variantId;
      if (i.chefNotes) item.chefNotes = i.chefNotes;
      if (i.seatLabel) item.seatLabel = i.seatLabel;
      if (i.weightQuantity !== undefined)
        item.weightQuantity = i.weightQuantity;
      if (i.manualPrice !== undefined) item.manualPrice = i.manualPrice;
      if (courseMode)
        item.courseNumber = isAddingToExisting
          ? roundCourseNumber
          : (i.course ?? 1);
      if (i.modifiers.length) {
        item.selectedOptions = i.modifiers.map((m) => ({
          optionId: m.optionId,
          quantity: m.quantity,
          ...(m.zoneLabel ? { zoneLabel: m.zoneLabel } : {}),
        }));
      }

      return item;
    });

    if (isAddingToExisting) {
      const combos = comboCart.map((line) => ({
        comboId: line.combo.id,
        quantity: line.quantity,
        selections: line.selections,
        ...(courseMode
          ? {
              courseNumber: isAddingToExisting
                ? roundCourseNumber
                : (line.courseNumber ?? 1),
            }
          : {}),
      }));
      const validated = addOrderItemsSchema.safeParse({
        ...(items.length ? { items } : {}),
        ...(combos.length ? { combos } : {}),
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
          combos,
          ...(orderNotes ? { notes: orderNotes } : {}),
          ...(couponCode.trim() ? { couponCode: couponCode.trim() } : {}),
          ...(selectedPromotionIds.length
            ? { promotionIds: selectedPromotionIds }
            : {}),
        },
        { onSuccess: () => onOrderPlaced(existingOrderId!) },
      );
    } else {
      const combos = comboCart.map((line) => ({
        comboId: line.combo.id,
        quantity: line.quantity,
        selections: line.selections,
        ...(courseMode
          ? {
              courseNumber: isAddingToExisting
                ? roundCourseNumber
                : (line.courseNumber ?? 1),
            }
          : {}),
      }));
      const validated = createOrderSchema.safeParse({
        type: orderType,
        ...(orderType === "DINE_IN" && tableId ? { tableId } : {}),
        ...(customerId ? { customerId } : {}),
        ...(customerGroupId ? { customerGroupId } : {}),
        billingMode,
        ...(billingMode === "PER_COVER"
          ? { coverCount, perCoverPriceRuleId }
          : {}),
        ...(orderNotes ? { notes: orderNotes } : {}),
        ...(couponCode.trim() ? { couponCode: couponCode.trim() } : {}),
        ...(selectedPromotionIds.length
          ? { promotionIds: selectedPromotionIds }
          : {}),
        ...(items.length ? { items } : {}),
        ...(combos.length ? { combos } : {}),
      });
      if (!validated.success) {
        toast({ title: "Please check the order details", tone: "danger" });
        return;
      }

      const orderInput: CreateOrderInput = {
        type: validated.data.type,
        ...(items.length ? { items } : {}),
        ...(combos.length ? { combos } : {}),
        ...(couponCode.trim() ? { couponCode: couponCode.trim() } : {}),
        ...(selectedPromotionIds.length
          ? { promotionIds: selectedPromotionIds }
          : {}),
        ...(validated.data.tableId ? { tableId: validated.data.tableId } : {}),
        ...(validated.data.customerId
          ? { customerId: validated.data.customerId }
          : {}),
        ...(customerGroupId ? { customerGroupId } : {}),
        billingMode,
        ...(billingMode === "PER_COVER"
          ? { coverCount, perCoverPriceRuleId }
          : {}),
        ...(validated.data.notes ? { notes: validated.data.notes } : {}),
      };
      createOrderMutation.mutate(orderInput, {
        onSuccess: (data) => onOrderPlaced(data.id),
      });
    }
  }

  const totalItems =
    cart.reduce((s, i) => s + i.quantity, 0) +
    comboCart.reduce((s, line) => s + line.quantity, 0);
  const lineItemTotal =
    cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0) +
    comboCart.reduce(
      (sum, line) => sum + estimateComboSubtotal(line, menuById),
      0,
    );
  const selectedCoverRule = perCoverRules.find(
    (rule) => rule.id === perCoverPriceRuleId,
  );
  const selectedCoverRate = Number(selectedCoverRule?.price ?? 0);
  const totalPrice =
    !isAddingToExisting && billingMode === "PER_COVER"
      ? coverCount * selectedCoverRate
      : lineItemTotal;
  const allItems =
    scopedCategories?.flatMap((c: WaiterMenuCategory) => c.menuItems ?? []) ??
    [];
  const resolvedActiveCategory =
    activeCategory ?? scopedCategories?.[0]?.id ?? null;
  const activeItems: OrderableMenuItem[] = (
    menuSearch.length >= 2
      ? allItems.filter((i) =>
          i.name.toLowerCase().includes(menuSearch.toLowerCase()),
        )
      : (scopedCategories?.find((c) => c.id === resolvedActiveCategory)
          ?.menuItems ?? [])
  ).filter((i) => foodTypeFilter === "ALL" || i.foodType === foodTypeFilter);

  const isPending = addItemsMutation.isPending || createOrderMutation.isPending;
  const needsTable = !isAddingToExisting && orderType === "DINE_IN" && !tableId;

  return (
    <div
      className={`${isAddingToExisting ? "waiter-shell h-screen" : "h-full"} relative flex flex-col bg-background`}
    >
      {isAddingToExisting && (
        <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 safe-area-top">
          <IconButton
            icon={ArrowLeft}
            aria-label="Close menu"
            size="lg"
            onClick={onBack}
            className="h-10 w-10 rounded-xl bg-surface-secondary"
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-medium text-text-primary">
              Add to order
            </h1>
            <p className="text-xs text-text-secondary">
              Choose items for the next round
            </p>
          </div>
        </div>
      )}

      {}
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
          customerGroups={customerGroups}
          customerGroupId={customerGroupId}
          onCustomerGroupChange={setCustomerGroupId}
          billingMode={billingMode}
          onBillingModeChange={(mode) => {
            setBillingMode(mode);
            if (mode === "LINE_ITEMS") setPerCoverPriceRuleId("");
          }}
          coverCount={coverCount}
          onCoverCountChange={setCoverCount}
          perCoverRules={perCoverRules}
          perCoverPriceRuleId={perCoverPriceRuleId}
          onPerCoverPriceRuleChange={setPerCoverPriceRuleId}
        />
      )}

      <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex min-h-0 min-w-0 flex-col">
          <div className="shrink-0 border-b border-border bg-background">
            {activeMenus.length > 1 && (
              <div className="px-4 pt-3">
                <SelectMenu
                  label="Menu"
                  value={selectedMenuId || undefined}
                  onChange={(value) => {
                    setSelectedMenuId(value);
                    setActiveCategory(null);
                  }}
                  className="min-h-11 rounded-xl"
                  options={activeMenus.map((menu) => ({
                    value: menu.id,
                    label: menu.name,
                  }))}
                />
              </div>
            )}
            <SearchBar value={menuSearch} onChange={setMenuSearch} />
            <CategoryTabs
              foodTypeFilter={foodTypeFilter}
              onFoodTypeChange={setFoodTypeFilter}
              categories={scopedCategories}
              activeCategory={resolvedActiveCategory}
              onCategoryChange={setActiveCategory}
              menuSearch={menuSearch}
            />
          </div>

          {!isAddingToExisting && activeCombos.length > 0 && (
            <section className="bg-surface border-b border-border px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-disabled">
                Combos
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {activeCombos.map((combo) => (
                  <button
                    key={combo.id}
                    type="button"
                    onClick={() => openCombo(combo)}
                    className="min-w-48 rounded-xl border border-border bg-surface-secondary p-3 text-left"
                  >
                    <span className="block text-sm font-semibold text-text-primary">
                      {combo.name}
                    </span>
                    <span className="mt-1 block text-xs text-text-secondary">
                      {combo.pricePolicy === "FIXED"
                        ? `₹${Number(combo.fixedPrice ?? 0).toFixed(2)}`
                        : `${Number(combo.percentOff ?? 0)}% off components`}{" "}
                      · customize
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {}
          <MenuGrid
            items={activeItems}
            cart={cart}
            isLoading={menuLoading}
            menuSearch={menuSearch}
            onItemTap={handleItemTap}
            onQtyChange={updateQty}
          />
        </section>

        <TabletOrderRail
          cart={cart}
          combos={comboCart}
          totalItems={totalItems}
          totalPrice={totalPrice}
          isAddingToExisting={isAddingToExisting}
          onUpdateQty={updateQty}
          onUpdateComboQty={updateComboQty}
          onEditItem={editCartItem}
          onReview={() => setShowCart(true)}
        />
      </div>

      {}
      {totalItems > 0 && (
        <div className="absolute inset-x-0 bottom-0 z-30 bg-transparent px-3.5 py-3 safe-area-bottom md:hidden">
          <button
            onClick={() => setShowCart(true)}
            className="waiter-cart-bar flex min-h-[58px] w-full items-center justify-between rounded-[17px] px-[15px] font-medium text-white shadow-lg"
          >
            <span className="text-left">
              <small className="block text-xs font-normal text-white/75">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </small>
              <strong className="block text-[15px] font-medium">
                ₹{totalPrice.toFixed(2)}
              </strong>
            </span>
            <span className="flex min-h-10 items-center rounded-xl bg-white px-3.5 text-xs font-medium text-[#173c2a]">
              {isAddingToExisting ? "Review additions" : "Review order"} →
            </span>
          </button>
        </div>
      )}

      {}
      {customising && (
        <ItemCustomiser
          item={customising.item}
          {...(customising.existingCartItem
            ? { existingCartItem: customising.existingCartItem }
            : {})}
          courseMode={courseMode && !isAddingToExisting}
          onConfirm={confirmCustomisedItem}
          onClose={() => setCustomising(null)}
        />
      )}

      {customisingCombo && (
        <ComboCustomiser
          combo={customisingCombo}
          menuById={menuById}
          selections={comboSelections}
          onToggle={toggleComboOption}
          onAdd={addSelectedCombo}
          onClose={() => {
            setCustomisingCombo(null);
            setComboSelections([]);
          }}
        />
      )}

      {}
      {showCart && (
        <CartSummary
          cart={cart}
          combos={comboCart}
          menuById={menuById}
          isAddingToExisting={isAddingToExisting}
          courseSequencingAvailable={courseSequencingAvailable}
          courseMode={courseMode}
          onCourseModeChange={setCourseModeEnabled}
          roundCourseNumber={roundCourseNumber}
          onRoundCourseNumberChange={setRoundCourseNumber}
          onUpdateCourse={updateItemCourse}
          onUpdateComboCourse={updateComboCourse}
          orderNotes={orderNotes}
          onOrderNotesChange={setOrderNotes}
          couponCode={couponCode}
          onCouponCodeChange={setCouponCode}
          promotions={promotions.filter(
            (promotion) => promotion.isActive && !promotion.couponCode,
          )}
          selectedPromotionIds={selectedPromotionIds}
          onTogglePromotion={(id) =>
            setSelectedPromotionIds((current) =>
              current.includes(id)
                ? current.filter((value) => value !== id)
                : [...current, id],
            )
          }
          totalItems={totalItems}
          totalPrice={totalPrice}
          isPending={isPending}
          needsTable={needsTable}
          onUpdateQty={updateQty}
          onUpdateComboQty={updateComboQty}
          onEditItem={editCartItem}
          onSubmit={handleSubmit}
          onClose={() => setShowCart(false)}
        />
      )}
    </div>
  );
};
