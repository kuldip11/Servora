import { useEffect, useRef } from "react";
import { toast } from "@pos/ui";
import type { KitchenTicket } from "@pos/types";
import { useRealtimeEvent } from "../../../shared/lib/realtime";

export function useKitchenAttention() {
  const initialized = useRef(false);

  useEffect(() => {
    initialized.current = true;
    return () => {
      initialized.current = false;
    };
  }, []);

  useRealtimeEvent("kitchen.ticket.created", (event) => {
    if (!initialized.current) return;
    const ticket = event.payload as KitchenTicket;
    const table = ticket.order?.table?.name;
    toast({
      title: table ? `New ticket · Table ${table}` : "New kitchen ticket",
      tone: "info",
      duration: 3000,
    });
  });
}
