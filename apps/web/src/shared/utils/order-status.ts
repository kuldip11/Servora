export const getOrderStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    OPEN: "bg-info-surface text-info",
    BILL_REQUESTED: "bg-warning-surface text-warning",
    PAID: "bg-primary-surface text-primary",
    CLOSED: "bg-surface-secondary text-text-secondary",
    CANCELLED: "bg-danger-surface text-danger",
  };
  return map[status] ?? "bg-surface-secondary text-text-secondary";
};

export const getOrderStatusLabel = (status: string): string => {
  return status.replace(/_/g, " ");
};
