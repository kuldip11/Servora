import { useEffect, useRef, useState } from "react";
import type { CustomerOrder } from "../../api";

const MAX_RECONNECT_DELAY = 30_000;
const INITIAL_RECONNECT_DELAY = 1_000;

export function useCustomerOrderRealtime(
  sessionToken: string | undefined,
  orderId: string | undefined,
  onOrder: (order: CustomerOrder) => void,
  onRequestUpdate?: (status: string) => void,
) {
  const [live, setLive] = useState(false);
  const reconnectTimer = useRef<number | undefined>(undefined);
  const pingTimer = useRef<number | undefined>(undefined);
  const reconnectAttempt = useRef(0);

  useEffect(() => {
    if (!sessionToken || sessionToken === "fixture" || !orderId) {
      setLive(false);
      return;
    }

    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const configured = import.meta.env.VITE_WS_URL as string | undefined;
    const wsBase = (configured ?? `${proto}://${window.location.host}/ws/events`).replace(/\/events$/, "");
    let stopped = false;
    let socket: WebSocket | undefined;

    const clearTimers = () => {
      if (pingTimer.current !== undefined) {
        window.clearInterval(pingTimer.current);
        pingTimer.current = undefined;
      }
      if (reconnectTimer.current !== undefined) {
        window.clearTimeout(reconnectTimer.current);
        reconnectTimer.current = undefined;
      }
    };

    const scheduleReconnect = () => {
      if (stopped || reconnectTimer.current !== undefined) return;
      const delay = Math.min(
        INITIAL_RECONNECT_DELAY * 2 ** reconnectAttempt.current,
        MAX_RECONNECT_DELAY,
      );
      reconnectAttempt.current += 1;
      reconnectTimer.current = window.setTimeout(() => {
        reconnectTimer.current = undefined;
        connect();
      }, delay);
    };

    const connect = () => {
      if (stopped) return;
      clearTimers();
      socket = new WebSocket(`${wsBase}/customer/events?session=${encodeURIComponent(sessionToken)}`);

      socket.onopen = () => {
        reconnectAttempt.current = 0;
        setLive(true);
        pingTimer.current = window.setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) socket.send("ping");
        }, 25_000);
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as {
            type?: string;
            payload?: CustomerOrder & { id?: string; status?: string; customerSessionId?: string };
          };
          if (message.type === "order.updated" && message.payload?.id === orderId) {
            onOrder(message.payload);
          }
          if (message.type === "customer.request.updated" && message.payload?.status) {
            onRequestUpdate?.(message.payload.status);
          }
        } catch {
          // Ignore malformed events. The next valid event or fallback poll remains authoritative.
        }
      };

      socket.onerror = () => {
        setLive(false);
      };

      socket.onclose = () => {
        setLive(false);
        if (pingTimer.current !== undefined) {
          window.clearInterval(pingTimer.current);
          pingTimer.current = undefined;
        }
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      stopped = true;
      clearTimers();
      socket?.close();
      setLive(false);
    };
  }, [sessionToken, orderId, onOrder, onRequestUpdate]);

  return live;
}
