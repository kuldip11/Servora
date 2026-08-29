import { RestaurantTable } from "./common";

export type OrderStatus =
  "OPEN" | "BILL_REQUESTED" | "PAID" | "CLOSED" | "CANCELLED";

export type KitchenTicketStatus =
  "PENDING_PAYMENT" | "FIRED" | "PREPARING" | "READY" | "SERVED";

export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "ONLINE";
export type OrderItemFulfillmentType = "DINE_IN" | "TAKEAWAY";

export interface Order {
  id: string;
  tenantId: string;
  branchId: string;
  tableId: string | null;
  table?: RestaurantTable | null;
  customerId: string | null;
  status: OrderStatus;
  type: OrderType;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes: string | null;
  items: OrderItem[];
  kitchenTickets?: KitchenTicket[];
  statusHistory: OrderStatusHistory[];
  payments?: import("./billing").Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface KitchenTicket {
  id: string;
  tenantId: string;
  branchId: string;
  orderId: string;
  order?: Order;
  ticketNumber: number;
  status: KitchenTicketStatus;
  notes: string | null;
  items: OrderItem[];
  firedAt: string;
  readyAt: string | null;
  servedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  variantId: string | null;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  chefNotes: string | null;
  fulfillmentType: OrderItemFulfillmentType;
  modifiers: OrderItemModifier[];
  createdAt?: string;
}

export interface OrderItemModifier {
  modifierId: string;
  modifierGroupName: string | null;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  oldStatus: OrderStatus | null;
  newStatus: OrderStatus;
  changedBy: string;
  reason: string | null;
  changedAt: string;
}
