import { RestaurantTable } from "./common";
import type { InventoryItem } from "./inventory";
import type { KitchenTicket, Order } from "./orders";

export type RealtimeEvent =
  | {
      type: "order.created";
      payload: Order;
    }
  | {
      type: "order.updated";
      payload: Order;
    }
  | {
      type: "kitchen.ticket.created";
      payload: {
        orderId: string;
        ticketId?: string;
      };
    }
  | {
      type: "kitchen.ticket.updated";
      payload: KitchenTicket;
    }
  | {
      type: "inventory.low_stock";
      payload: InventoryItem;
    }
  | {
      type: "table.updated";
      payload: RestaurantTable;
    };
