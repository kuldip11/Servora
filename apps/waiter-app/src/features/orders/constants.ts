export const orderKeys = {
  all: ["orders"] as const,
  detail: (id: string) => ["order", id] as const,
};

export const ORDERS_POLL_INTERVAL_MS = 15_000;
export const ORDER_DETAIL_POLL_INTERVAL_MS = 10_000;

export const STATUS_CONFIG = {
  OPEN: { label: "Open", color: "text-info", bg: "bg-info-surface" },
  BILL_REQUESTED: {
    label: "Bill Requested",
    color: "text-warning",
    bg: "bg-warning-surface",
  },
  PAID: { label: "Paid", color: "text-primary", bg: "bg-primary-surface" },
  CLOSED: {
    label: "Closed",
    color: "text-text-secondary",
    bg: "bg-surface-secondary",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-danger",
    bg: "bg-danger-surface",
  },
} satisfies Record<string, { label: string; color: string; bg: string }>;

export const TICKET_STATUS_LABEL: Record<string, string> = {
  HELD: "Held",
  FIRED: "Waiting",
  PREPARING: "Cooking",
  READY: "Ready",
  SERVED: "Served",
};

