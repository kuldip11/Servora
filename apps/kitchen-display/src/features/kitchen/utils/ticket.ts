import { formatDistanceToNow } from "date-fns";
import type { KitchenTicket } from "@pos/types";
import { URGENT_THRESHOLD_MS } from "../constants";

export function calculateElapsedMs(firedAt: string): number {
  return Date.now() - new Date(firedAt).getTime();
}

export function isUrgent(firedAt: string): boolean {
  return calculateElapsedMs(firedAt) > URGENT_THRESHOLD_MS;
}

export function formatTicketAge(firedAt: string): string {
  return formatDistanceToNow(new Date(firedAt), { addSuffix: false });
}

export function groupTicketsByStatus(
  tickets: KitchenTicket[] | undefined,
  status: KitchenTicket["status"],
): KitchenTicket[] {
  return tickets?.filter((t) => t.status === status) ?? [];
}
