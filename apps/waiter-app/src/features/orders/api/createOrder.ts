import { apiClient } from "../../../shared/lib/api-client";
import type { Order } from "@pos/types";
import type { AddOrderItemInput } from "./orders";
import { createOrderSchema } from "@pos/validation";

export interface CreateOrderInput {
  type: "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "ONLINE";
  tableId?: string;
  customerId?: string;
  notes?: string;
  items: AddOrderItemInput[];
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const validated = createOrderSchema.parse(input);
  const res = await apiClient.post("/orders", validated);
  return res.data.data;
}
