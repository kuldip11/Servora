import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Search, ShoppingBag, Sparkles, Utensils } from "lucide-react";
import { Button, Card, EmptyState, IconButton, SearchInput, Skeleton } from "@pos/ui";
import { checkoutCustomerOrder, createCustomerOrder, createCustomerRequest, createCustomerSession, getCustomerMenu, getCustomerOrder, type CustomerMenu, type CustomerMenuItem, type CustomerOrder, type CustomerRequestType } from "./api";
import { menu as fixtureMenu, restaurant as fixtureRestaurant, categories as fixtureCategories, type CustomerMenuItem as FixtureItem } from "./dev/fixtures/data";
import { CartView } from "./features/cart/CartView";
import { getCartLineKey, getCartSummary, type CartLine, type SelectedOption } from "./features/cart/pricing";
import { canAddItemConfiguration, normalizeSelectedOptions } from "./features/cart/configuration";
import { createOrderPayload } from "./features/order/payload";
import { ItemCustomization } from "./features/menu/ItemCustomization";
import { MenuCard } from "./features/menu/MenuCard";
import { OrderPlaced } from "./features/ordering/OrderPlaced";
import { useCustomerOrderRealtime } from "./features/ordering/useCustomerOrderRealtime";
import { StatusScreen } from "./features/session/StatusScreen";
import { formatMoney } from "./shared/utils/money";

export type View = "menu" | "cart" | "order";

function fixtureToCustomerItem(item: FixtureItem): CustomerMenuItem {
  return {
    id: item.id,
    categoryId: item.category,
    name: item.name,
    description: item.description,
    basePrice: String(item.price),
    taxRate: "5",
    imageUrl: item.image,
    foodType: item.foodType,
    spiceLevel: item.spice ?? null,
    prepTimeMinutes: 20,
    variants: [],
    modifierGroupLinks: item.options ? [{ sortOrder: 0, group: { id: "fixture", name: "Customize", selectionType: "SINGLE", minSelections: 0, maxSelections: 1, options: item.options.map((option) => ({ id: option.id, name: option.name, additionalPrice: String(option.price), isAvailable: true, maxQuantity: 1 })) } }] : [],
    tagLinks: item.popular ? [{ tag: { name: "popular" } }] : [],
    allergenLinks: [],
    images: [],
  };
}

export function CustomerApp() {
  const params = new URLSearchParams(window.location.search);
  const qrToken = params.get("qr");
  const demoMode = params.get("demo") === "true";
  const [session, setSession] = useState<{ token: string; table: string; area: string; restaurant: string; estimatedTime: string } | null>(null);
  const [menu, setMenu] = useState<CustomerMenuItem[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [view, setView] = useState<View>("menu");
  const [category, setCategory] = useState("Popular");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderNotes, setOrderNotes] = useState("");
  const [selected, setSelected] = useState<CustomerMenuItem | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [placedOrder, setPlacedOrder] = useState<CustomerOrder | null>(null);
  const [paymentPending, setPaymentPending] = useState(false);
  const [loading, setLoading] = useState(Boolean(qrToken));
  const [error, setError] = useState<string | null>(null);
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);

  useEffect(() => {
    if (demoMode && !qrToken) {
      setSession({ token: "fixture", table: fixtureRestaurant.table, area: fixtureRestaurant.area, restaurant: fixtureRestaurant.name, estimatedTime: fixtureRestaurant.estimatedTime });
      setMenu(fixtureMenu.map(fixtureToCustomerItem));
      setCategories(fixtureCategories.map((name) => ({ id: name, name })));
      setLoading(false);
      return;
    }
    if (!qrToken) {
      setLoading(false);
      setError("Open this page from a restaurant table QR code to start an ordering session.");
      return;
    }

    const token = qrToken;
    const storageKey = `servora:customer:${token}`;
    let cancelled = false;

    async function bootstrap() {
      try {
        setLoading(true);
        setError(null);

        const saved = sessionStorage.getItem(storageKey);
        let sessionToken: string | undefined;
        let savedOrderId: string | undefined;
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as { sessionToken?: string; placedOrderId?: string };
            sessionToken = parsed.sessionToken;
            savedOrderId = parsed.placedOrderId;
          } catch {
            sessionStorage.removeItem(storageKey);
          }
        }

        let created: Awaited<ReturnType<typeof createCustomerSession>>;
        if (sessionToken) {
          try {
            const menuResponse = await getCustomerMenu(sessionToken);
            if (cancelled) return;
            setSession({ token: sessionToken, table: menuResponse.table.name, area: menuResponse.table.section ?? "Dining", restaurant: menuResponse.restaurant.name, estimatedTime: "15–25 min" });
            setMenu(menuResponse.items);
            setCategories([{ id: "popular", name: "Popular" }, ...menuResponse.categories.map((c) => ({ id: c.id, name: c.name }))]);
            if (savedOrderId) {
              try {
                const savedOrder = await getCustomerOrder(sessionToken, savedOrderId);
                if (!cancelled) {
                  setPlacedOrder(savedOrder);
                  setPaymentPending(!savedOrder.payments.some((payment) => payment.status === "SUCCESS"));
                  setView("order");
                }
              } catch {
                sessionStorage.removeItem(storageKey);
              }
            }
            return;
          } catch {
            sessionStorage.removeItem(storageKey);
          }
        }

        created = await createCustomerSession(token);
        const menuResponse = await getCustomerMenu(created.sessionToken);
        if (cancelled) return;
        setSession({ token: created.sessionToken, table: created.table.name, area: created.table.section ?? "Dining", restaurant: created.restaurant.name, estimatedTime: "15–25 min" });
        setMenu(menuResponse.items);
        setCategories([{ id: "popular", name: "Popular" }, ...menuResponse.categories.map((c) => ({ id: c.id, name: c.name }))]);
        sessionStorage.setItem(storageKey, JSON.stringify({ sessionToken: created.sessionToken }));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load this table");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void bootstrap();
    return () => { cancelled = true; };
  }, [demoMode, qrToken, bootstrapAttempt]);

  const handleRealtimeOrder = useCallback((order: CustomerOrder) => {
    setPlacedOrder(order);
    setPaymentPending(!order.payments.some((payment) => payment.status === "SUCCESS"));
  }, []);
  const handleRequestUpdate = useCallback((status: string) => {
    setRequestMessage(status === "ACKNOWLEDGED" ? "Your request has been acknowledged." : "Your request has been resolved.");
  }, []);
  const live = useCustomerOrderRealtime(session?.token, placedOrder?.id, handleRealtimeOrder, handleRequestUpdate);

  useEffect(() => {
    if (!placedOrder || !session || session.token === "fixture" || live) return;
    let cancelled = false;
    const interval = window.setInterval(async () => {
      try {
        const refreshed = await getCustomerOrder(session.token, placedOrder.id);
        if (!cancelled) handleRealtimeOrder(refreshed);
      } catch {
        // Keep the last known order state. Realtime reconnect/polling will retry.
      }
    }, 15000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [placedOrder?.id, session, live, handleRealtimeOrder]);

  useEffect(() => {
    if (!qrToken || !session || session.token === "fixture") return;
    const storageKey = `servora:customer:${qrToken}`;
    sessionStorage.setItem(storageKey, JSON.stringify({
      sessionToken: session.token,
      ...(placedOrder ? { placedOrderId: placedOrder.id } : {}),
    }));
  }, [qrToken, session, placedOrder?.id]);

  const requestHelp = useCallback(async (type: CustomerRequestType) => {
    if (!session || session.token === "fixture") {
      setRequestMessage("Help requests are available when you enter from a table QR.");
      return;
    }
    try {
      setRequestBusy(true);
      setRequestMessage(null);
      await createCustomerRequest(session.token, type, placedOrder?.id);
      setRequestMessage(type === "BILL" ? "Your waiter has been asked to bring the bill." : "Request sent. Someone will be with you shortly.");
    } catch (err) {
      setRequestMessage(err instanceof Error ? err.message : "Could not send request");
    } finally {
      setRequestBusy(false);
    }
  }, [placedOrder?.id, session]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const selectedCategory = categories.find((item) => item.name === category);
    const popularItems = menu.filter((item) => item.tagLinks.some((tag) => tag.tag.name.toLowerCase() === "popular"));
    return menu.filter((item, index) => {
      const categoryMatch = category === "Popular"
        ? (popularItems.length ? item.tagLinks.some((tag) => tag.tag.name.toLowerCase() === "popular") : index < 6)
        : item.categoryId === selectedCategory?.id;
      const searchMatch = !query || `${item.name} ${item.description ?? ""}`.toLowerCase().includes(query);
      return categoryMatch && searchMatch;
    });
  }, [menu, categories, category, search]);

  const { subtotal, tax, total, itemCount } = useMemo(() => {
    const summary = getCartSummary(cart);
    return summary;
  }, [cart]);

  const openItem = useCallback((item: CustomerMenuItem) => {
    setSelected(item);
    setSelectedVariantId(item.variants.length === 1 ? item.variants[0]?.id : undefined);
    setSelectedOptions([]);
    setError(null);
  }, []);

  const closeItem = useCallback(() => {
    setSelected(null);
    setSelectedVariantId(undefined);
    setSelectedOptions([]);
  }, []);

  const toggleOption = useCallback((optionId: string, groupId: string) => {
    const group = selected?.modifierGroupLinks.find(({ group: value }) => value.id === groupId)?.group;
    if (!group) return;
    setSelectedOptions((current) => {
      const existing = current.find((selection) => selection.optionId === optionId);
      if (existing) return current.filter((selection) => selection.optionId !== optionId);
      if (group.selectionType === "SINGLE") {
        return [...current.filter((selection) => !group.options.some((option) => option.id === selection.optionId)), { optionId, quantity: 1 }];
      }
      const selectedCount = current.filter((selection) => group.options.some((option) => option.id === selection.optionId)).length;
      if (group.maxSelections != null && selectedCount >= group.maxSelections) return current;
      return [...current, { optionId, quantity: 1 }];
    });
  }, [selected]);

  const changeOptionQuantity = useCallback((optionId: string, delta: number) => {
    setSelectedOptions((current) => current.flatMap((selection) => {
      if (selection.optionId !== optionId) return [selection];
      const option = selected?.modifierGroupLinks
        .flatMap(({ group }) => group.options)
        .find((value) => value.id === optionId);
      const next = selection.quantity + delta;
      if (next <= 0) return [];
      if (option && next > option.maxQuantity) return [selection];
      return [{ ...selection, quantity: next }];
    }));
  }, [selected]);

  const canAddSelectedItem = useMemo(() => (selected
    ? canAddItemConfiguration(selected, selectedVariantId, selectedOptions)
    : false), [selected, selectedVariantId, selectedOptions]);

  const addReadyItem = useCallback((item: CustomerMenuItem) => {
    if (item.variants.length || item.modifierGroupLinks.length) {
      openItem(item);
      return;
    }
    const newLine: CartLine = { item, quantity: 1, selectedOptions: [] };
    const key = getCartLineKey(newLine);
    setCart((current) => {
      const index = current.findIndex((line) => getCartLineKey(line) === key);
      if (index === -1) return [...current, newLine];
      return current.map((line, i) => i === index ? { ...line, quantity: line.quantity + 1 } : line);
    });
  }, [openItem]);

  const addItem = useCallback((item: CustomerMenuItem) => {
    if (!canAddSelectedItem) return;
    const newLine: CartLine = {
      item,
      quantity: 1,
      ...(selectedVariantId ? { variantId: selectedVariantId } : {}),
      selectedOptions: normalizeSelectedOptions(selectedOptions),
    };
    const key = getCartLineKey(newLine);
    setCart((current) => {
      const index = current.findIndex((line) => getCartLineKey(line) === key);
      if (index === -1) return [...current, newLine];
      return current.map((line, i) => i === index ? { ...line, quantity: line.quantity + 1 } : line);
    });
    closeItem();
  }, [canAddSelectedItem, selectedOptions, selectedVariantId, closeItem]);

  const changeQuantity = useCallback((index: number, delta: number) => {
    setCart((current) => current.flatMap((line, i) => i !== index ? [line] : line.quantity + delta > 0 ? [{ ...line, quantity: line.quantity + delta }] : []));
  }, []);

  const handleMenu = useCallback(() => setView("menu"), []);
  const handleOrderMore = useCallback(() => {
    setPlacedOrder(null);
    setPaymentPending(false);
    setError(null);
    setOrderNotes("");
    setView("menu");
  }, []);
  const handleCart = useCallback(() => setView("cart"), []);

  const sessionToken = session?.token;

  const checkoutOrder = useCallback(async (orderId: string) => {
    if (!sessionToken || sessionToken === "fixture") return;
    setLoading(true);
    setError(null);
    try {
      await checkoutCustomerOrder(sessionToken, orderId);
      const refreshed = await getCustomerOrder(sessionToken, orderId);
      handleRealtimeOrder(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start payment");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleRealtimeOrder, sessionToken]);

  const placeOrder = useCallback(async () => {
    if (!session || cart.length === 0 || loading) return;
    try {
      setLoading(true);
      setError(null);
      if (session.token === "fixture") {
        setPlacedOrder({ id: `fixture-${Date.now()}`, status: "OPEN", subtotal: subtotal.toFixed(2), taxAmount: tax.toFixed(2), totalAmount: total.toFixed(2), createdAt: new Date().toISOString(), kitchenTickets: [{ id: "fixture-ticket", ticketNumber: 1, status: "PREPARING" }], payments: [] });
        setPaymentPending(true);
        setCart([]);
        setView("order");
        return;
      }

      // Create the order once. If checkout fails, retain the created order so
      // retrying payment never creates a second customer order.
      const order = await createCustomerOrder(session.token, createOrderPayload(cart, orderNotes));
      setPlacedOrder(order);
      setPaymentPending(!order.payments.some((payment) => payment.status === "SUCCESS"));
      setCart([]);
      setView("order");

      try {
        await checkoutCustomerOrder(session.token, order.id);
        const refreshed = await getCustomerOrder(session.token, order.id);
        handleRealtimeOrder(refreshed);
      } catch (checkoutError) {
        setError(checkoutError instanceof Error ? checkoutError.message : "Order created, but payment could not be started");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to place order");
    } finally {
      setLoading(false);
    }
  }, [cart, handleRealtimeOrder, loading, orderNotes, session, subtotal, tax, total]);

  const handleAddSelectedItem = useCallback(() => {
    if (selected) addItem(selected);
  }, [addItem, selected]);

  const handleRetryCheckout = useCallback(() => {
    if (placedOrder) void checkoutOrder(placedOrder.id);
  }, [checkoutOrder, placedOrder]);

  if (loading && !session) return (
    <main className="min-h-screen bg-background p-5" aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-2xl pt-6 sm:px-1">
        <div className="space-y-3">
          <Skeleton height="0.75rem" width="8rem" />
          <Skeleton height="2rem" width="14rem" />
          <Skeleton height="1rem" width="18rem" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Skeleton height="2.5rem" />
          <Skeleton height="2.5rem" />
          <Skeleton height="2.5rem" />
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-4 rounded-lg border border-border bg-surface p-3">
              <Skeleton height="7rem" width="7rem" radius="lg" />
              <div className="min-w-0 flex-1 space-y-3 py-1">
                <Skeleton height="1rem" width="65%" />
                <Skeleton height="0.875rem" width="100%" />
                <Skeleton height="0.875rem" width="80%" />
                <Skeleton height="1rem" width="35%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
  if (error && !session) return <StatusScreen title="This table is unavailable" message={error} actionLabel="Try again" onAction={() => { setError(null); setBootstrapAttempt((value) => value + 1); }} />;
  if (!session) return null;

  if (view === "order" && placedOrder) return <OrderPlaced order={placedOrder} table={session.table} estimatedTime={session.estimatedTime} onMenu={handleOrderMore} live={live} onRequest={requestHelp} requestBusy={requestBusy} requestMessage={requestMessage} paymentPending={paymentPending} checkoutError={error} checkoutBusy={loading} onRetryCheckout={handleRetryCheckout} />;

  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-primary-surface">
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-xl">
          <div className="mx-auto max-w-2xl px-4 pb-3 pt-4 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0"><div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-text-secondary"><span>{session.area}</span><span>•</span><span>Table {session.table}</span></div><h1 className="mt-1 truncate text-xl font-semibold tracking-tight">{session.restaurant}</h1><p className="text-sm text-text-secondary">Order directly from your table</p></div>
              <div className="relative shrink-0"><IconButton aria-label="Open cart" icon={ShoppingBag} variant="primary" size="lg" onClick={handleCart} />
              {itemCount > 0 && <span aria-label={`${itemCount} items in cart`} className="pointer-events-none absolute right-3 top-3 flex h-5 min-w-5 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface px-1 text-[11px] font-bold text-text-primary ring-2 ring-background">{itemCount}</span>}
              </div>
            </div>
            <div className="mt-4"><SearchInput value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} placeholder="Search the menu" aria-label="Search the menu" /></div>
            <nav aria-label="Menu categories" className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">{categories.map((option) => <Button key={option.id} variant={category === option.name ? "primary" : "secondary"} size="sm" onClick={() => setCategory(option.name)} className="shrink-0 rounded-full">{option.name}</Button>)}</nav>
          </div>
        </header>

        <main className="mx-auto max-w-2xl scroll-pb-32 px-4 pb-36 pt-5 sm:px-6 sm:pb-32">
          {category === "Popular" && !search && <Card className="mb-5 border-primary bg-primary p-5 text-primary-foreground shadow-md"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] opacity-75"><Sparkles className="h-3.5 w-3.5" /> Recommended</div><h2 className="mt-2 text-2xl font-semibold">Good choice for the table.</h2><p className="mt-1 text-sm leading-6 opacity-80">Order directly from your table. Your order goes straight to the kitchen.</p></div><Utensils className="mt-1 h-6 w-6 opacity-75" /></div></Card>}
          <div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-text-secondary">Menu</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">{category}</h2></div><span className="text-sm text-text-secondary">{visibleItems.length} items</span></div>
          <div className="space-y-3">{visibleItems.map((item) => <MenuCard key={item.id} item={item} onSelect={openItem} onQuickAdd={addReadyItem} />)}{visibleItems.length === 0 && <EmptyState icon={Search} title="No dishes found" description="Try another category or search term." size="sm" />}</div>
        </main>

        {error && <div role="alert" className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-2xl rounded-lg border border-danger bg-danger-surface p-4 text-sm font-medium text-danger shadow-md"><div className="flex items-start justify-between gap-4"><span>{error}</span><Button variant="ghost" size="sm" onClick={() => setError(null)}>Dismiss</Button></div></div>}
        {itemCount > 0 && view === "menu" && <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 px-4 pt-3 sm:px-6"><Button onClick={handleCart} size="lg" className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-5"><span className="flex items-center gap-2 text-sm"><ShoppingBag className="h-4 w-4" /> {itemCount} {itemCount === 1 ? "item" : "items"}</span><span className="flex items-center gap-2 text-sm">View order · {formatMoney(total)} <ChevronRight className="h-4 w-4" /></span></Button></div>}

        {selected && <ItemCustomization item={selected} selectedOptions={selectedOptions} {...(selectedVariantId ? { variantId: selectedVariantId } : {})} onVariantChange={setSelectedVariantId} onToggle={toggleOption} onOptionQuantity={changeOptionQuantity} onClose={closeItem} onAdd={handleAddSelectedItem} />}
        {view === "cart" && <CartView cart={cart} subtotal={subtotal} tax={tax} total={total} table={session.table} onBack={handleMenu} onChange={changeQuantity} onPlace={placeOrder} loading={loading} orderNotes={orderNotes} onNotesChange={setOrderNotes} />}
    </div>
  );
}
