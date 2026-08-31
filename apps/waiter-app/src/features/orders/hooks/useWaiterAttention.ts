import { toast } from "@pos/ui";
import { useRealtimeEvent } from "@/shared/lib/realtime";

export const useWaiterAttention = () => {
  useRealtimeEvent("kitchen.ticket.updated", (event) => {
    if (event.payload.status !== "READY") return;
    const table = event.payload.order?.table?.name;
    toast({
      title: table ? `Order ready · Table ${table}` : "Order ready for pickup",
      tone: "success",
      duration: 3500,
    });
  });

  useRealtimeEvent("customer.request.created", (event) => {
    toast({
      title: `New customer request · ${String(event.payload.type).replace(/_/g, " ").toLowerCase()}`,
      tone: "warning",
      duration: 3500,
    });
  });
};
