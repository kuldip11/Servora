import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCustomerRequest,
  createCustomerSession,
  getCustomerMenu,
  getCustomerOrder,
  type CustomerCombo,
  type CustomerMenuItem,
  type CustomerOrder,
  type CustomerRequestType,
} from "../../api";
import type { CartLine } from "../cart/pricing";
import {
  clearPersistedOrderId,
  clearPersistedSession,
  getCustomerStorageScope,
  loadPersistedOrderId,
  loadPersistedSession,
  restoreCart,
  savePersistedCart,
  savePersistedOrderId,
  savePersistedSession,
} from "../cart/persistence";
import { useCustomerOrderRealtime } from "../ordering/useCustomerOrderRealtime";

export type CustomerSessionState = {
  token: string;
  mode: "DINE_IN" | "TAKEAWAY";
  table: string | null;
  area: string;
  restaurant: string;
  estimatedTime: string;
  expiresAt: string;
};

export function useCustomerSession() {
  const qrToken = useMemo(
    () => new URLSearchParams(window.location.search).get("qr"),
    [],
  );
  const storageScope = useMemo(
    () => getCustomerStorageScope(qrToken),
    [qrToken],
  );
  const [session, setSession] = useState<CustomerSessionState | null>(null);
  const [menu, setMenu] = useState<CustomerMenuItem[]>([]);
  const [combos, setCombos] = useState<CustomerCombo[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [placedOrder, setPlacedOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(Boolean(qrToken));
  const [error, setError] = useState<string | null>(null);
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const [cartHydrated, setCartHydrated] = useState(false);

  useEffect(() => {
    if (!qrToken) {
      setLoading(false);
      setError(
        "Open this page from a restaurant table QR code to start an ordering session.",
      );
      return;
    }

    let cancelled = false;
    async function bootstrap() {
      try {
        setLoading(true);
        setCartHydrated(false);
        setError(null);
        const persisted = storageScope ? loadPersistedSession(storageScope) : null;
        let sessionToken = persisted?.token;
        let created: Awaited<ReturnType<typeof createCustomerSession>> | null = null;
        let menuResponse: Awaited<ReturnType<typeof getCustomerMenu>> | undefined;

        if (sessionToken) {
          try {
            menuResponse = await getCustomerMenu(sessionToken);
          } catch {
            if (storageScope) clearPersistedSession(storageScope);
            sessionToken = undefined;
          }
        }
        if (!menuResponse) {
          created = await createCustomerSession(qrToken);
          sessionToken = created.sessionToken;
          menuResponse = await getCustomerMenu(sessionToken);
        }
        if (cancelled || !sessionToken) return;

        const resolvedSession: CustomerSessionState = {
          token: sessionToken,
          mode: menuResponse.mode,
          table: menuResponse.table?.name ?? null,
          area:
            menuResponse.table?.section ??
            (menuResponse.mode === "TAKEAWAY" ? "Takeaway" : "Dining"),
          restaurant: menuResponse.restaurant.name,
          estimatedTime: "15–25 min",
          expiresAt:
            created?.expiresAt ??
            persisted?.expiresAt ??
            new Date(Date.now() + 12 * 60 * 60_000).toISOString(),
        };
        setSession(resolvedSession);
        setMenu(menuResponse.items);
        setCombos(menuResponse.combos ?? []);
        setCategories([
          { id: "popular", name: "Popular" },
          ...menuResponse.categories.map((category) => ({
            id: category.id,
            name: category.name,
          })),
        ]);

        if (storageScope) {
          savePersistedSession(storageScope, resolvedSession);
          const persistedOrderId = loadPersistedOrderId(storageScope);
          if (persistedOrderId) {
            try {
              const existingOrder = await getCustomerOrder(
                sessionToken,
                persistedOrderId,
              );
              if (!cancelled) setPlacedOrder(existingOrder);
            } catch {
              clearPersistedOrderId(storageScope);
            }
          }
          const restored = restoreCart(
            storageScope,
            menuResponse.items,
            menuResponse.mode,
          );
          if (!cancelled) {
            setCart(restored.cart);
            setCartHydrated(true);
            if (restored.droppedCount > 0) {
              setError(
                "Some saved cart items are no longer available and were removed.",
              );
            }
          }
        } else {
          setCartHydrated(true);
        }
      } catch (bootstrapError) {
        if (!cancelled) {
          setError(
            bootstrapError instanceof Error
              ? bootstrapError.message
              : "Unable to load this ordering session",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [qrToken, bootstrapAttempt, storageScope]);

  useEffect(() => {
    if (!storageScope || !cartHydrated) return;
    savePersistedCart(storageScope, cart);
  }, [storageScope, cart, cartHydrated]);

  useEffect(() => {
    if (!storageScope || !placedOrder) return;
    savePersistedOrderId(storageScope, placedOrder.id);
  }, [storageScope, placedOrder]);

  const handleRealtimeOrder = useCallback((order: CustomerOrder) => {
    setPlacedOrder(order);
  }, []);
  const handleRealtimeMenuAvailability = useCallback(() => {
    setBootstrapAttempt((attempt) => attempt + 1);
  }, []);
  const live = useCustomerOrderRealtime(
    session?.token,
    placedOrder?.id,
    handleRealtimeOrder,
    handleRealtimeMenuAvailability,
  );

  useEffect(() => {
    if (!placedOrder || !session || live) return;
    let cancelled = false;
    const interval = window.setInterval(async () => {
      try {
        const refreshed = await getCustomerOrder(session.token, placedOrder.id);
        if (!cancelled) handleRealtimeOrder(refreshed);
      } catch {
        // Keep the last known order state until realtime or polling succeeds.
      }
    }, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [placedOrder?.id, session, live, handleRealtimeOrder]);

  const requestHelp = useCallback(
    async (type: CustomerRequestType) => {
      if (!session) return;
      try {
        setRequestBusy(true);
        setRequestMessage(null);
        await createCustomerRequest(session.token, type, placedOrder?.id);
        setRequestMessage(
          type === "BILL"
            ? "Your waiter has been asked to bring the bill."
            : "Request sent. Someone will be with you shortly.",
        );
      } catch (requestError) {
        setRequestMessage(
          requestError instanceof Error
            ? requestError.message
            : "Could not send request",
        );
      } finally {
        setRequestBusy(false);
      }
    },
    [placedOrder?.id, session],
  );

  const retryBootstrap = useCallback(() => {
    setError(null);
    setBootstrapAttempt((value) => value + 1);
  }, []);

  return {
    session,
    menu,
    combos,
    categories,
    cart,
    setCart,
    placedOrder,
    setPlacedOrder,
    loading,
    setLoading,
    error,
    setError,
    requestBusy,
    requestMessage,
    storageScope,
    live,
    requestHelp,
    retryBootstrap,
  };
}
