import { AlertTriangle, ChefHat, Package, ShoppingBag } from "lucide-react";

export const ANALYTICS_STATUS_TONE: Partial<
  Record<string, "info" | "warning" | "neutral" | "danger">
> = {
  OPEN: "info",
  BILL_REQUESTED: "warning",
  CLOSED: "neutral",
  CANCELLED: "danger",
};

export const DASHBOARD_QUICK_ACTIONS = [
  { label: "New Order", icon: ShoppingBag, to: "/orders" as const },
  {
    label: "Kitchen Queue",
    icon: ChefHat,
    to: "/orders" as const,
    search: { view: "kitchen" },
  },
  { label: "Inventory", icon: Package, to: "/inventory" as const },
  {
    label: "Low Stock",
    icon: AlertTriangle,
    to: "/inventory" as const,
    search: { filter: "low" },
  },
] as const;

export const ANALYTICS_SELECT_CLASS =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary";
