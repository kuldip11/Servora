export const MENU_TABS = [
  { id: "items", label: "Items" },
  { id: "menus", label: "Menus" },
  { id: "combos", label: "Combos" },
  { id: "promotions", label: "Promotions" },
  { id: "loyalty", label: "Loyalty" },
  { id: "happy-hour", label: "Happy Hour" },
  { id: "advanced", label: "Advanced Models" },
  { id: "categories", label: "Categories" },
  { id: "modifiers", label: "Modifiers" },
  { id: "recipes", label: "Recipes" },
  { id: "availability", label: "Availability" },
  { id: "stations", label: "Stations" },
  { id: "tools", label: "Tools" },
] as const;

export type MenuTabId = (typeof MENU_TABS)[number]["id"];

export const MENU_CHANNELS = ["STAFF", "CUSTOMER_QR"] as const;
export const FULFILLMENT_TYPES = ["DINE_IN", "TAKEAWAY", "DELIVERY", "ONLINE"] as const;
export const INVENTORY_UNITS = ["KG", "GRAMS", "LITERS", "ML", "PIECES", "PACKETS"] as const;
export const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const TAG_COLORS = [
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
] as const;
export const MENU_SELECT_CLASS = "rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary";
export const MENU_INPUT_CLASS = "rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary";

import type { MenuItemStatus } from "@pos/types";
import type { StatusTone } from "@pos/ui";

export const MENU_ITEM_STATUS_META: Record<MenuItemStatus, { label: string; tone: StatusTone }> = {
  ACTIVE: { label: "Active", tone: "success" },
  OUT_OF_STOCK: { label: "Out of Stock", tone: "danger" },
  HIDDEN: { label: "Hidden", tone: "warning" },
  SEASONAL: { label: "Seasonal", tone: "info" },
  DISCONTINUED: { label: "Discontinued", tone: "neutral" },
};

export const MENU_ITEM_STATUS_OPTIONS: { value: MenuItemStatus; label: string }[] = (
  Object.keys(MENU_ITEM_STATUS_META) as MenuItemStatus[]
).map((value) => ({ value, label: MENU_ITEM_STATUS_META[value].label }));
