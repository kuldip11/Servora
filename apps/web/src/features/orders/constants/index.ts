export const ALL_ORDER_TYPES = [
  {
    value: "DINE_IN",
    label: "Dine In",
    capabilityKey: "dineInEnabled" as const,
  },
  {
    value: "TAKEAWAY",
    label: "Takeaway",
    capabilityKey: "takeawayEnabled" as const,
  },
  {
    value: "DELIVERY",
    label: "Delivery",
    capabilityKey: "deliveryEnabled" as const,
  },
  { value: "ONLINE", label: "Online", capabilityKey: "onlineEnabled" as const },
] as const;

export const ORDER_STATUS_TONE: Partial<
  Record<string, "info" | "warning" | "neutral" | "danger">
> = {
  OPEN: "info",
  BILL_REQUESTED: "warning",
  CLOSED: "neutral",
  CANCELLED: "danger",
};

export const ORDER_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "BILL_REQUESTED", label: "Bill Requested" },
  { value: "PAID", label: "Paid" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export const ORDER_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "DINE_IN", label: "Dine In" },
  { value: "TAKEAWAY", label: "Takeaway" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "ONLINE", label: "Online" },
] as const;
